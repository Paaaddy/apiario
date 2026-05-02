# Changelog

## [1.1.2](https://github.com/Paaaddy/apiario/compare/v1.1.1...v1.1.2) (2026-05-02)


### Bug Fixes

* **deps:** add commit-message prefix for release-please ([f83f868](https://github.com/Paaaddy/apiario/commit/f83f8689d5b89740c43773de93306732902c7fd7))

## [1.1.1](https://github.com/Paaaddy/apiario/compare/v1.1.0...v1.1.1) (2026-04-25)


### Bug Fixes

* block pinch-zoom via JS touchstart/touchmove for Firefox/IronFox ([ab517db](https://github.com/Paaaddy/apiario/commit/ab517dbf4d5d84d86d61f8a8bf9da048f2d6bdcd))
* disable pinch-zoom and remove fixed-chrome scaling infrastructure ([6ee4cc1](https://github.com/Paaaddy/apiario/commit/6ee4cc197bfd224dcbf9683f686e3e52c80268b5))
* downgrade vite to v7 and fix Tailwind v4 PostCSS config ([68d8dc5](https://github.com/Paaaddy/apiario/commit/68d8dc50c1857ca921063948609c354164e85bc8))
* pin vite to v7 and tailwindcss to v3 ([71eef2f](https://github.com/Paaaddy/apiario/commit/71eef2f75e27b2a1ab1e64da272d2eb3c1741668))
* prevent pinch-zoom on Firefox and make Theme C headers sticky ([2218079](https://github.com/Paaaddy/apiario/commit/221807976a54fbabcbf8296109a7c8f212628d9b))
* remove position:relative override that broke Theme A sticky headers ([cfa6054](https://github.com/Paaaddy/apiario/commit/cfa6054a58e514fcec7c5f25b1486281b12bf265))

## [1.1.0](https://github.com/Paaaddy/apiario/compare/v1.0.0...v1.1.0) (2026-04-25)


### Features

* **zoom:** keep UI chrome fixed while content scales ([#28](https://github.com/Paaaddy/apiario/issues/28)) ([345c0bd](https://github.com/Paaaddy/apiario/commit/345c0bd6c8ffc32acc0ea14d4b2d047c70b7cd0b))

## 1.0.0 (2026-04-21)


### Features

* 3-step onboarding wizard with profile capture ([40fec47](https://github.com/Paaaddy/apiario/commit/40fec478ff184d5e14e0cb3c0b5df212cc197c44))
* add Apiario name note to onboarding footer ([576f398](https://github.com/Paaaddy/apiario/commit/576f39816846da7bddf3752ef0ac7b4892b68fb9))
* add onboarding strings for OnboardJS flow ([6a28ff6](https://github.com/Paaaddy/apiario/commit/6a28ff6aad7090b4bbf10e6b5085b53087924065))
* add seasons and diagnosis content JSON ([0ab0239](https://github.com/Paaaddy/apiario/commit/0ab0239f99cd74b56dc2f6195df08afe6a961a37))
* add three-theme visual refresh with in-app switcher ([65e7def](https://github.com/Paaaddy/apiario/commit/65e7defa32bd645a1b12d9a9376ce70dd55761a2))
* Apiario v2 — i18n (DE/EN), sticky headers, task checkboxes, hive log ([0034858](https://github.com/Paaaddy/apiario/commit/0034858ba7107c123ad57e46bd0d8acbb413979d))
* app shell with bottom tab nav and onboarding gate ([bf39483](https://github.com/Paaaddy/apiario/commit/bf394835c52565eb24637e32ffe08137ad7543e3))
* audit fixes — ErrorBoundary, schema migration, log cap, offline fonts, refactor ([cc6bef9](https://github.com/Paaaddy/apiario/commit/cc6bef9cc27b9313d1430df71d62309a6ffde111))
* bootstrap Apiario — React + Vite + Tailwind ([6bacaa8](https://github.com/Paaaddy/apiario/commit/6bacaa82078322642b97ee6d132ebcdfcc70c268))
* debug panel behind ?debug query param ([6b53a3f](https://github.com/Paaaddy/apiario/commit/6b53a3ff97f8dbb8cf256064c2d66e2a3bb04634))
* diagnosis wizard with branching tree and outcome cards ([d1881d6](https://github.com/Paaaddy/apiario/commit/d1881d62293f0ed1f5c792d20c2b12449ae794df))
* floating bee FAB with voice hands-free demo mode ([1c09d7c](https://github.com/Paaaddy/apiario/commit/1c09d7cdf4780d68478261dd1b6a81fd2ba688b8))
* my hive screen with live profile editing ([001dd31](https://github.com/Paaaddy/apiario/commit/001dd31f6dbc51a916cab08db51a14c0ae61ac53))
* PWA manifest and Workbox offline precaching ([309a725](https://github.com/Paaaddy/apiario/commit/309a7254ae611dc0fc903d8070d6702809fc71c8))
* **pwa:** auto-refresh clients to latest service worker ([f7f5880](https://github.com/Paaaddy/apiario/commit/f7f58805ab283ba0f19f40ea289f8915370e0d52))
* **pwa:** auto-update service worker and refresh clients ([f80a993](https://github.com/Paaaddy/apiario/commit/f80a99318ab0bc64251266ca8cd53c4e4d51a2e1))
* rewrite Onboarding with OnboardJS 6-step flow ([298edd6](https://github.com/Paaaddy/apiario/commit/298edd65d37cb8f9f684c45f2da56b4d03945ada))
* season screen with profile-filtered task cards ([095ebbb](https://github.com/Paaaddy/apiario/commit/095ebbb9a14863baa0354e47e42c2bd1cbe59c60))
* season utility (date → season + week) with TDD ([7f9731f](https://github.com/Paaaddy/apiario/commit/7f9731f26ecb4bfea288867a8872cfaf7924a30c))
* useProfile hook with localStorage persistence ([0fd0720](https://github.com/Paaaddy/apiario/commit/0fd072088a0745f819077033e3dfd454eaa62a36))


### Bug Fixes

* apply honeycomb header style to onboarding ([89136ef](https://github.com/Paaaddy/apiario/commit/89136efd9f44aa79450af0c1783b1d799855f490))
* apply honeycomb header style to onboarding steps ([8ec378e](https://github.com/Paaaddy/apiario/commit/8ec378e61274a00d7c36dba162c7837434fbc66e))
* remove spurious handleVoiceStop dep from handleVoiceActivate useCallback ([609ec9e](https://github.com/Paaaddy/apiario/commit/609ec9e57af0dacca42b8638605ad6d172dff457))
* security hardening + performance optimizations ([f619bfa](https://github.com/Paaaddy/apiario/commit/f619bfaef3c9b4c31700a6fd13e304fc2044e3e3))
* security hardening, perf optimizations from code review ([5f35f34](https://github.com/Paaaddy/apiario/commit/5f35f349f21d9cfede8a7ea270ff2c8da0f2f6aa))
* set callExpert:true for varroa-confirmed diagnosis ([1983713](https://github.com/Paaaddy/apiario/commit/1983713626ba46c37fc47c2e94098ff83cc9609c))
* start-over always visible, fix font offline caching, fix icon purpose split ([79e337a](https://github.com/Paaaddy/apiario/commit/79e337a7e29406f36b36fd7ab35b03989d3f4281))
* voice cleanup on unmount, stale closure guard, mic error handling, double-activate guard ([8a51fc6](https://github.com/Paaaddy/apiario/commit/8a51fc67524c0a0d81714e7b387d2623c48fc498))
