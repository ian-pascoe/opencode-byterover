# opencode-byterover

## 0.1.7

### Patch Changes

- [#22](https://github.com/ian-pascoe/opencode-byterover/pull/22) [`82b1a93`](https://github.com/ian-pascoe/opencode-byterover/commit/82b1a938d6a5816b81a089277c01335d3a5b796f) Thanks [@ian-pascoe](https://github.com/ian-pascoe)! - Increase the default ByteRover search, recall, and persist timeouts; expose per-call `timeoutMs` on manual memory tools; and make manual persist fire-and-forget by default.

## 0.1.6

### Patch Changes

- [#20](https://github.com/ian-pascoe/opencode-byterover/pull/20) [`4e28547`](https://github.com/ian-pascoe/opencode-byterover/commit/4e285470d6bc3cf32fbdd7ad77828e56a4f6eaf2) Thanks [@ian-pascoe](https://github.com/ian-pascoe)! - Add manual `brv_recall`, `brv_search`, and `brv_persist` tools.

## 0.1.5

### Patch Changes

- [#17](https://github.com/ian-pascoe/opencode-byterover/pull/17) [`a272a6d`](https://github.com/ian-pascoe/opencode-byterover/commit/a272a6d0ab78654070af207d3ee47212c75ff7c6) Thanks [@ian-pascoe](https://github.com/ian-pascoe)! - Tighten plugin configuration validation, prevent duplicate concurrent curation, publish package type declarations, and improve ByteRover setup documentation.

## 0.1.4

### Patch Changes

- [#15](https://github.com/ian-pascoe/opencode-byterover/pull/15) [`5a665f7`](https://github.com/ian-pascoe/opencode-byterover/commit/5a665f7284a2094da84f9b775afcbe0e07c9330e) Thanks [@ian-pascoe](https://github.com/ian-pascoe)! - Fix ByteRover `.brv/.gitignore` bootstrapping so existing ignore files are upgraded with missing generated-state rules without removing custom rules.

## 0.1.3

### Patch Changes

- [#13](https://github.com/ian-pascoe/opencode-byterover/pull/13) [`cf726b6`](https://github.com/ian-pascoe/opencode-byterover/commit/cf726b62e5471d4ebb8c29c4a2fef918f171dfdb) Thanks [@ian-pascoe](https://github.com/ian-pascoe)! - Bound curated-turn dedupe state with a per-plugin LRU cache to prevent unbounded session growth.

## 0.1.2

### Patch Changes

- [#11](https://github.com/ian-pascoe/opencode-byterover/pull/11) [`4f6affc`](https://github.com/ian-pascoe/opencode-byterover/commit/4f6affc7eaafaed373e282ab007a5f71a1df4e2f) Thanks [@ian-pascoe](https://github.com/ian-pascoe)! - Add an npm package badge to the README and align the documented configuration defaults with the plugin defaults.

## 0.1.1

### Patch Changes

- [#7](https://github.com/ian-pascoe/opencode-byterover/pull/7) [`78ce893`](https://github.com/ian-pascoe/opencode-byterover/commit/78ce8935c6bc4d705ae49da86cfdad4d3919ed91) Thanks [@ian-pascoe](https://github.com/ian-pascoe)! - Respect `brvPath` parameter and add high-value tests (vitest)

- [#8](https://github.com/ian-pascoe/opencode-byterover/pull/8) [`11f33b7`](https://github.com/ian-pascoe/opencode-byterover/commit/11f33b754031c462d72e70717afe83caf5bab923) Thanks [@ian-pascoe](https://github.com/ian-pascoe)! - Fix format and lint ignore patterns to include changesets

## 0.1.0

### Minor Changes

- [#1](https://github.com/ian-pascoe/opencode-byterover/pull/1) [`2b899af`](https://github.com/ian-pascoe/opencode-byterover/commit/2b899af095106efab3344dc2096e969099fdd079) Thanks [@ian-pascoe](https://github.com/ian-pascoe)! - Initial release
