# Benchmark writing precedents

Date: 26 August 2026

## Recommended editorial contract

Present each result as an observation from a dated campaign. State the task, timer boundary, sample count, and important configuration limits before the table. Keep the full method and exact artifacts one click away.

Use this page order:

1. Current complete action-to-frame results from 11 August 2026.
2. Historical warm-operation results from 30 July 2026.
3. Modal-only product experiments from 8 August 2026.

This order answers the reader's likely first question. It also keeps separate campaigns from appearing to form one comparison.

## Patterns to apply

### Define the measurement before the values

Use one short paragraph before each campaign. Include:

- the operation;
- the timer start and end;
- the number of warmups and measured samples;
- the unit;
- the comparison limit that most affects interpretation.

SPEC describes a benchmark result as an observation. It requires the report to state all performance-relevant conditions. This framing supports wording such as `measured`, `observed`, and `recorded under this configuration`. It does not support broad product claims from one campaign. See [SPEC CPU 2026 run and reporting rules](https://www.spec.org/cpu2026/docs/runrules.html#rule_1.2).

Dan Luu's latency work follows the same pattern in practical prose. He defines the physical start and end of the timer. He also explains how his boundary differs from other measurements. See [Computer latency: 1977-2017](https://danluu.com/input-lag/) and [Some latency measurement pitfalls](https://danluu.com/latency-pitfalls/).

For this page, use a sentence with this structure:

> On 30 July 2026, this campaign measured each warm operation after the desktop and client were ready. Each table reports 30 successful samples per path and task.

Follow it with the exact timer boundary and exclusions. Put the provider-configuration caveat before the first provider table.

### Separate complete paths from component operations

Keep the 11 August fused action-to-frame campaign in its own section. Keep the 30 July screenshot, click, typing, and command measurements in a dated historical section.

Use the measured fused values for complete-turn claims:

- 43.13 ms p50 and 46.35 ms p95 for the 11 August cross-provider campaign;
- 44.29 ms p50 and 52.57 ms p95 for the 8 August same-topology promotion run.

Treat the 37.25 ms screenshot and 9.85 ms click values as separate warm operations. Do not present their 47.10 ms sum as a measured turn. Dan Luu's discussion of client-side and server-side latency shows why measurement boundaries change the meaning of a value. See [Some latency measurement pitfalls](https://danluu.com/latency-pitfalls/).

### State comparison limits next to the comparison

Place this point before the historical tables:

> The provider paths used different caller placement, regions, resources, screenshot formats, and request shapes. The tables describe the recorded paths under those configurations.

Keep the wording factual. Use `p50 ratio to Modal optimized` as the column heading. Avoid `times faster`. A ratio heading states the calculation and avoids ambiguity about direction.

MLCommons requires compatible benchmark scenarios for direct comparisons. It also requires authors to disclose configuration differences and define derived metrics. This precedent supports explicit path labels, provider details, and a ratio heading that names its basis. See the [MLPerf results messaging guidelines](https://github.com/mlcommons/policies/blob/master/MLPerf_Results_Messaging_Guidelines.adoc#4-mlperf-results-may-only-be-compared-against-similar-mlperf-results) and [MLPerf Inference: Datacenter](https://mlcommons.org/benchmarks/inference-datacenter/).

Dan Luu gives a close practical example. A reported benchmark win reversed when he aligned the interfaces. He also labels changing results as point-in-time estimates. See [The benchmarkpocalypse](https://danluu.com/benchpocalypse/).

### Use six short tables

Create one table for each task. Use this shape:

| Path | p50 (ms) | p95 (ms) | p50 ratio to Modal optimized |
| --- | ---: | ---: | ---: |
| Modal optimized | value | value | 1.00x |
| Daytona default | value | value | value |
| E2B default | value | value | value |
| Modal simple | value | value | value |
| Tzafon default | value | value | value |

Use the same row order in every table. Keep every numeric column right aligned. Preserve the values from the canonical report.

This design has two direct writing precedents. ISO recommends several short tables when one table becomes complicated. Google's table guidance also recommends splitting a long or complicated table. Google asks authors to introduce each table with a complete sentence and use concise, sentence-case headings. See [ISO House Style: Plain language](https://www.iso.org/ISO-house-style.html#plain-language) and [Google developer documentation style guide: Tables](https://developers.google.com/style/tables).

Give each table a task heading and one complete introductory sentence. The heading supplies the table's accessible name in the existing Markdown structure. The sentence tells readers what the task means.

### Put the current evidence first and date every campaign

Use the date in the section heading. Use `Current` only for the newest eligible campaign. Use `Historical` for the July campaign. Keep the dates visible when readers scan headings.

SPEC attaches the original publication date to supported results. MLCommons keeps a change log for modified or invalidated published results. These practices support visible dates, immutable evidence links, and a separate historical section. See [SPEC submitting results](https://www.spec.org/spec/submitting_results/) and [MLPerf Inference: Datacenter](https://mlcommons.org/benchmarks/inference-datacenter/).

Google advises authors to replace words such as `latest` and `currently` with an explicit date or version when time matters. See [Timeless documentation](https://developers.google.com/style/timeless-documentation).

Link the report and sanitized artifacts at an exact commit SHA. Keep the report as the narrative source. Keep the JSON artifacts as the data source.

### Preserve precision without implying certainty

Show the report's exact p50 and p95 values in tables. Use rounded values or ranges in prose when exact decimals do not help the reader.

Dan Luu rounds camera measurements to avoid false precision. He also states when small differences should not be considered significant. The page can follow the same posture without changing the canonical table values. See [Computer latency: 1977-2017](https://danluu.com/input-lag/).

Report p50 and p95 together. State the sample count. Do not describe a difference as significant unless the source report tested significance. Google Benchmark explains that repeated benchmark results can be noisy and reports multiple aggregate statistics for that reason. See the [Google Benchmark user guide](https://github.com/google/benchmark/blob/main/docs/user_guide.md#statistics-reporting-the-mean-median-and-standard-deviation--coefficient-of-variation-of-repeated-benchmarks).

### Keep caveats short and visible

Put the main comparability caveat in normal page text. Use the accordion for provider versions, caller placement, target resources, screenshot format, dimensions, cursor behavior, request counts, and retry policy.

Do not hide the fact that configurations differ inside the accordion. Readers need that fact before they interpret the ratios.

Dan Luu places important conditions beside the discussion and moves the full experimental setup to an appendix. His terminal measurements also distinguish idle median, loaded median, and tail latency in the table. See [Terminal latency](https://danluu.com/term-latency/).

## Prose model

Use direct sentences with one purpose each. Prefer this pattern:

> The current campaign measured one click through the next decoded and validated screenshot. Modal used `computer.step()`. The other providers used their recorded action and screenshot paths. The configurations differed across providers.

Follow with the table. Then state run facts such as failures and retries. End with exact evidence links.

Avoid promotional conclusions. Let the values and ratios carry the comparison. Prefer `The run measured` and `The table reports` over `Modal delivers` or `Modal outperforms`.

Google's writing guidance asks authors to make performance claims verifiable and tied to the scenario. It also advises against superlatives such as `best` and `fastest`. See [Avoid excessive claims](https://developers.google.com/style/excessive-claims).

This style matches ISO 24495-1's plain-language goal. Readers should find, understand, and use the information they need. ISO's public guidance recommends short sentences, one idea per sentence, useful headings, and several simple tables. See [ISO 24495-1:2023](https://www.iso.org/standard/78907.html) and [ISO House Style: Plain language](https://www.iso.org/ISO-house-style.html#plain-language).

## Review checklist

- Does the first section contain the newest complete-path measurement?
- Does every campaign heading include its date?
- Does each section define the timer before the table?
- Does each section state the sample count?
- Are unlike campaigns visually separate?
- Does every ratio name its denominator?
- Is the provider-configuration caveat visible before the historical tables?
- Are measured fused values separate from component measurements?
- Does each table use the same provider order and units?
- Do evidence links use exact commit SHAs?
- Does the prose describe observations without extending the claim beyond the report?
