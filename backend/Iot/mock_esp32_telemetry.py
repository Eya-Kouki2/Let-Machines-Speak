#!/usr/bin/env python3

import argparse
import json
import math
import random
import time
import uuid

# ---- constants mirrored 1:1 from the .ino (keep these in sync with the firmware) ----
SAMPLE_PERIOD_S = 0.002          # 2ms -> 500Hz (SAMPLE_PERIOD_US = 2000)
BASE_ALPHA = 0.02                # slow EMA baseline, not a filter on the published samples
AC_DEADBAND = 0.15
FREQ_WINDOW_SAMPLES = 250        # recompute tuning every ~0.5s at 500Hz
MAX_WINDOW = 20
BATCH_SIZE = 50                  # ~100ms of data per MQTT publish at 500Hz


class AxisState:
    """Mirrors AxisState + processAxis() in the .ino."""

    def __init__(self):
        self.base = 0.0
        self.base_init = False
        self.cross_count = 0
        self.last_pos = True
        self.sign_init = False

    def process(self, raw):
        if not self.base_init:
            self.base = raw
            self.base_init = True
        else:
            self.base = BASE_ALPHA * raw + (1 - BASE_ALPHA) * self.base

        ac = raw - self.base
        sig = abs(ac) > AC_DEADBAND
        pos = ac >= 0

        if not self.sign_init:
            if sig:
                self.last_pos = pos
            self.sign_init = True
        else:
            if sig and pos != self.last_pos:
                self.cross_count += 1
            if sig:
                self.last_pos = pos


def compute_batch_stats(buf, baseline):
    """Mirrors computeBatchStats() in the .ino: RMS/peak/crest of (raw - baseline)."""
    n = len(buf)
    if n == 0:
        return 0.0, 0.0, 0.0
    sq_sum = 0.0
    peak = 0.0
    for v in buf:
        ac = v - baseline
        sq_sum += ac * ac
        peak = max(peak, abs(ac))
    rms = math.sqrt(sq_sum / n)
    crest = (peak / rms) if rms > 1e-6 else 0.0
    return rms, peak, crest


def arduino_json(obj):
    """Compact JSON text matching ArduinoJson's serializeJson() output:
    no whitespace, and NaN/Infinity written as the bare (non-standard)
    tokens nan/inf/-inf rather than quoted or python's 'NaN'/'Infinity'.
    This is literally what the real device puts on the wire for temp_c
    (never wired) and current_a/bus_voltage_v/power_mw when the INA219
    isn't present.
    """
    if obj is None:
        return "null"
    if isinstance(obj, bool):
        return "true" if obj else "false"
    if isinstance(obj, float):
        if math.isnan(obj):
            return "nan"
        if math.isinf(obj):
            return "inf" if obj > 0 else "-inf"
        s = f"{obj:.6f}".rstrip("0").rstrip(".")
        return s if s not in ("", "-") else "0"
    if isinstance(obj, int):
        return str(obj)
    if isinstance(obj, str):
        return json.dumps(obj)
    if isinstance(obj, dict):
        return "{" + ",".join(f"{json.dumps(k)}:{arduino_json(v)}" for k, v in obj.items()) + "}"
    if isinstance(obj, list):
        return "[" + ",".join(arduino_json(v) for v in obj) + "]"
    raise TypeError(f"unsupported type for arduino_json: {type(obj)}")


class MockDevice:
    """Synthetic stand-in for the MPU6050 + INA219 + batching/tuning logic in the .ino."""

    def __init__(self, device_id, ina219_ready=True, seed=None):
        self.device_id = device_id
        self.ina219_ready = ina219_ready
        self.rng = random.Random(seed)

        self.axis_x, self.axis_y, self.axis_z = AxisState(), AxisState(), AxisState()

        self.alpha = 0.5
        self.window_size = 5
        self.auto_alpha = 0.5
        self.auto_window = 5
        self.est_hz = 0.0
        self.override_active = False
        self.freq_sample_counter = 0

        self.batch_x, self.batch_y, self.batch_z = [], [], []

        self.t = 0.0  # simulated seconds elapsed, drives the synthetic waveform

        # Plausible "normal running machine" synthetic signal, loosely in the
        # range of features_normal_cleaned.csv -- NOT an attempt to reproduce
        # its exact per-axis statistics.
        self.gravity = (0.30, 0.20, 9.70)         # gentle fixed tilt, dominated by Z
        self.vib_freq_hz = (28.0, 24.0, 60.0)     # small sinusoidal vibration components
        self.vib_amp = (0.05, 0.06, 0.05)
        self.noise_std = (0.030, 0.050, 0.040)    # sets the rough RMS per axis

    def read_sensor(self):
        gx, gy, gz = self.gravity
        fx, fy, fz = self.vib_freq_hz
        ax, ay, az = self.vib_amp
        nx, ny, nz = self.noise_std

        raw_x = gx + ax * math.sin(2 * math.pi * fx * self.t) + self.rng.gauss(0, nx)
        raw_y = gy + ay * math.sin(2 * math.pi * fy * self.t) + self.rng.gauss(0, ny)
        raw_z = gz + az * math.sin(2 * math.pi * fz * self.t) + self.rng.gauss(0, nz)

        self.t += SAMPLE_PERIOD_S
        return raw_x, raw_y, raw_z

    def recompute_tuning(self):
        """Mirrors recomputeTuning() in the .ino."""
        window_duration_s = FREQ_WINDOW_SAMPLES * SAMPLE_PERIOD_S
        avg_crossings = (self.axis_x.cross_count + self.axis_y.cross_count + self.axis_z.cross_count) / 3.0
        self.est_hz = avg_crossings / (2.0 * window_duration_s)

        if self.est_hz < 0.5:
            self.auto_window = 10
            self.auto_alpha = 0.3
        else:
            sample_rate_hz = 1.0 / SAMPLE_PERIOD_S
            samples_per_cycle = sample_rate_hz / self.est_hz
            desired = samples_per_cycle / 4.0
            self.auto_window = min(max(int(desired), 2), MAX_WINDOW)
            self.auto_alpha = min(max(2.0 / (self.auto_window + 1), 0.05), 0.9)

        if not self.override_active:
            self.alpha = self.auto_alpha
            self.window_size = self.auto_window

        self.axis_x.cross_count = self.axis_y.cross_count = self.axis_z.cross_count = 0

    def apply_config(self, msg):
        """Mirrors onMqttMessage() for messages on devices/<id>/config."""
        if msg.get("reset"):
            self.override_active = False
            self.alpha = self.auto_alpha
            self.window_size = self.auto_window
            return
        if "alpha" in msg or "window" in msg:
            self.override_active = True
            if "alpha" in msg:
                self.alpha = float(msg["alpha"])
            if "window" in msg:
                self.window_size = int(msg["window"])

    def sample_and_maybe_batch(self):
        """Advance one 2ms sample period. Returns a payload dict once a 50-sample batch fills, else None."""
        raw_x, raw_y, raw_z = self.read_sensor()

        self.axis_x.process(raw_x)
        self.axis_y.process(raw_y)
        self.axis_z.process(raw_z)

        self.freq_sample_counter += 1
        if self.freq_sample_counter >= FREQ_WINDOW_SAMPLES:
            self.recompute_tuning()
            self.freq_sample_counter = 0

        if len(self.batch_x) < BATCH_SIZE:
            self.batch_x.append(raw_x)
            self.batch_y.append(raw_y)
            self.batch_z.append(raw_z)

        if len(self.batch_x) >= BATCH_SIZE:
            return self.build_payload()
        return None

    def build_payload(self):
        """Mirrors publishBatch() in the .ino."""
        rms_x, peak_x, crest_x = compute_batch_stats(self.batch_x, self.axis_x.base)
        rms_y, peak_y, crest_y = compute_batch_stats(self.batch_y, self.axis_y.base)
        rms_z, peak_z, crest_z = compute_batch_stats(self.batch_z, self.axis_z.base)

        if self.ina219_ready:
            current_a = round(0.040 + self.rng.gauss(0, 0.003), 4)
            bus_voltage_v = round(3.82 + self.rng.gauss(0, 0.01), 3)
            power_mw = round(current_a * bus_voltage_v * 1000, 0)
        else:
            current_a = bus_voltage_v = power_mw = float("nan")

        payload = {
            "device_id": self.device_id,
            "timestamp": int(time.time() * 1000),
            "sample_rate_hz": int(round(1.0 / SAMPLE_PERIOD_S)),
            "accel": {
                "x": [round(v, 3) for v in self.batch_x],
                "y": [round(v, 3) for v in self.batch_y],
                "z": [round(v, 3) for v in self.batch_z],
            },
            "stats": {
                "x": {"rms": round(rms_x, 3), "peak": round(peak_x, 3), "crest": round(crest_x, 2)},
                "y": {"rms": round(rms_y, 3), "peak": round(peak_y, 3), "crest": round(crest_y, 2)},
                "z": {"rms": round(rms_z, 3), "peak": round(peak_z, 3), "crest": round(crest_z, 2)},
            },
            "temp_c": float("nan"),   # never wired on the real device either (readTempC() always returns NAN)
            "current_a": current_a,
            "bus_voltage_v": bus_voltage_v,
            "power_mw": power_mw,
            "filter_meta": {
                "alpha": round(self.alpha, 3),
                "window": self.window_size,
                "est_hz": round(self.est_hz, 2),
                "auto": not self.override_active,
            },
        }

        self.batch_x, self.batch_y, self.batch_z = [], [], []
        return payload


def make_mqtt_client(client_id):
    import paho.mqtt.client as mqtt
    try:
        # paho-mqtt >= 2.0 requires an explicit callback API version
        return mqtt.Client(mqtt.CallbackAPIVersion.VERSION1, client_id=client_id)
    except AttributeError:
        # paho-mqtt < 2.0
        return mqtt.Client(client_id=client_id)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--broker", default="test.mosquitto.org", help="MQTT broker host (default: test.mosquitto.org, matches the .ino)")
    parser.add_argument("--port", type=int, default=1883)
    parser.add_argument("--device-id", default="node01", help="matches DEVICE_ID in the .ino")
    parser.add_argument("--duration", type=float, default=None, help="seconds to run; default: run forever (Ctrl+C to stop)")
    parser.add_argument("--speed", type=float, default=1.0, help="1.0 = real-time 500Hz sampling; higher = faster than the real device, 0 = no throttling at all")
    parser.add_argument("--no-ina219", action="store_true", help="simulate a missing INA219 (current_a/bus_voltage_v/power_mw -> nan), like the real device when it can't find the sensor")
    parser.add_argument("--dry-run", action="store_true", help="print payloads to stdout instead of publishing over MQTT (no network needed)")
    parser.add_argument("--seed", type=int, default=None, help="seed the synthetic signal's RNG for reproducible runs")
    args = parser.parse_args()

    device = MockDevice(args.device_id, ina219_ready=not args.no_ina219, seed=args.seed)
    telemetry_topic = f"devices/{args.device_id}/telemetry"
    config_topic = f"devices/{args.device_id}/config"

    client = None
    if not args.dry_run:
        def on_config(_client, _userdata, msg):
            try:
                payload = json.loads(msg.payload.decode())
            except (json.JSONDecodeError, UnicodeDecodeError):
                return
            device.apply_config(payload)
            print(f"[config] {payload} -> alpha={device.alpha:.3f} window={device.window_size} auto={not device.override_active}")

        client_id = f"esp32_{args.device_id}_{uuid.uuid4().hex[:8]}"
        client = make_mqtt_client(client_id)
        client.on_message = on_config
        print(f"Connecting to {args.broker}:{args.port} ...")
        client.connect(args.broker, args.port, keepalive=30)
        client.subscribe(config_topic)
        client.loop_start()
        print(f"Publishing to {telemetry_topic}, listening on {config_topic}")

    start = time.time()
    batches_sent = 0
    try:
        while True:
            payload = device.sample_and_maybe_batch()
            if payload is not None:
                line = arduino_json(payload)
                if args.dry_run:
                    print(line)
                else:
                    client.publish(telemetry_topic, line, qos=0, retain=False)
                batches_sent += 1

            if args.speed > 0:
                time.sleep(SAMPLE_PERIOD_S / args.speed)

            if args.duration is not None and (time.time() - start) >= args.duration:
                break
    except KeyboardInterrupt:
        print("\nstopped by user")
    finally:
        print(f"{batches_sent} batches sent ({batches_sent * BATCH_SIZE} samples)")
        if client is not None:
            client.loop_stop()
            client.disconnect()


if __name__ == "__main__":
    main()
