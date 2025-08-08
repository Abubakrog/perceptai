# WARNING: Demo-only sandbox runner. Not secure for untrusted code in production.

import runpy
import sys
import resource
import signal
from types import MappingProxyType


def _limit_resources():
    # Soft CPU limit: 2 seconds, memory ~256MB
    resource.setrlimit(resource.RLIMIT_CPU, (2, 2))
    resource.setrlimit(resource.RLIMIT_AS, (256 * 1024 * 1024, 256 * 1024 * 1024))


def _alarm_handler(signum, frame):
    raise TimeoutError("Execution timed out")


def main():
    if len(sys.argv) < 2:
        print("Usage: python -m app.sandbox_runner <script_path>", file=sys.stderr)
        sys.exit(2)

    script_path = sys.argv[1]

    # Setup very constrained environment
    _limit_resources()
    signal.signal(signal.SIGALRM, _alarm_handler)
    signal.alarm(2)

    # Clear sys.path except current dir
    sys.path[:] = [""]

    # Run the script as __main__ with runpy (isolated-ish)
    try:
        runpy.run_path(script_path, run_name="__main__")
    finally:
        signal.alarm(0)


if __name__ == "__main__":
    main()