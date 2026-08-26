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
    assert mcu.__version__ == "2.0.1"
    for name in (
        "ActionConfig",
        "AsyncBorrowedComputer",
        "AsyncComputerSandbox",
        "BorrowedComputer",
        "BrowserConfig",
        "ComputerConfig",
        "ComputerSandbox",
        "ComputerSandboxManager",
        "ComputerSessionHandle",
        "ComputerStepResult",
        "ComputerStepTiming",
        "DaemonClient",
        "ImageReleaseSpec",
        "ResourceConfig",
        "ScreenshotOptions",
        "StorageConfig",
    ):
        assert getattr(mcu, name)

    require_parameters(mcu.ComputerSandbox.create, "config")
    require_parameters(mcu.ComputerSandbox.attach, "sandbox_id")
    require_parameters(mcu.ComputerSandbox.terminate, "wait")
    require_parameters(mcu.AsyncComputerSandbox.create, "config")
    require_parameters(mcu.AsyncComputerSandbox.create_unplaced, "config")
    require_parameters(mcu.AsyncComputerSandbox.attach, "sandbox_id")
    require_parameters(mcu.AsyncComputerSandbox.terminate, "wait")
    require_parameters(
        mcu.ComputerSessionHandle.borrow_async,
        "run_id",
        "function_region",
    )
    require_parameters(
        mcu.AsyncBorrowedComputer.step,
        "actions",
        "continue_on_error",
        "screenshot_options",
        "max_action_timeout_ms",
        "call_id",
    )
    require_parameters(
        mcu.BorrowedComputer.step,
        "actions",
        "continue_on_error",
        "screenshot_options",
        "max_action_timeout_ms",
        "call_id",
    )

    defaults = mcu.ComputerConfig()
    assert defaults.actions.screenshot_capture_source == "mss"
    assert defaults.actions.input_rate_limit_per_sec == 100
    assert defaults.actions.input_rate_limit_burst == 400

    with mcu.ComputerSandbox.local() as computer:
        assert callable(computer.browser.open_url)
        assert callable(computer.mouse.move)
        assert callable(computer.screenshots.full)
        assert callable(computer.artifacts.download)
        assert callable(computer.actions.run)


if __name__ == "__main__":
    main()
