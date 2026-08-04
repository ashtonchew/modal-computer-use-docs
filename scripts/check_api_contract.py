from __future__ import annotations

import inspect

import modal_computer_use as mcu


def require_parameters(callable_: object, *names: str) -> None:
    parameters = inspect.signature(callable_).parameters
    missing = [name for name in names if name not in parameters]
    if missing:
        qualified_name = getattr(callable_, "__qualname__", repr(callable_))
        raise AssertionError(f"{qualified_name} is missing parameters: {', '.join(missing)}")


def main() -> None:
    assert mcu.__version__ == "1.1.0"
    for name in (
        "AsyncComputerSandbox",
        "BrowserConfig",
        "ComputerConfig",
        "ComputerSandbox",
        "ComputerSandboxManager",
        "DaemonClient",
        "ResourceConfig",
        "StorageConfig",
    ):
        assert getattr(mcu, name)

    require_parameters(mcu.ComputerSandbox.create, "config")
    require_parameters(mcu.ComputerSandbox.attach, "sandbox_id")
    require_parameters(mcu.ComputerSandbox.terminate, "wait")
    require_parameters(mcu.AsyncComputerSandbox.create, "config")
    require_parameters(mcu.AsyncComputerSandbox.attach, "sandbox_id")
    require_parameters(mcu.AsyncComputerSandbox.terminate, "wait")

    with mcu.ComputerSandbox.local() as computer:
        assert callable(computer.browser.open_url)
        assert callable(computer.mouse.move)
        assert callable(computer.screenshots.full)
        assert callable(computer.artifacts.download)
        assert callable(computer.actions.run)


if __name__ == "__main__":
    main()
