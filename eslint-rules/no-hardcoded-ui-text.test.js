import { RuleTester } from 'eslint'
import rule from './no-hardcoded-ui-text.js'

const tester = new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
})

tester.run('no-hardcoded-ui-text', rule, {
  valid: [
    // Text from the strings module, rendered through t()
    { code: `const el = <p>{t(s.season_week)}</p>` },
    // Bilingual pair rendered through t()
    { code: `const el = <p>{t({ de: 'Woche', en: 'Week' })}</p>` },
    // Numbers and variables are not text
    { code: `const el = <p>{count} {t(s.season_tasks_noun)}</p>` },
    // Symbol-only JSX text: no letters, nothing to translate
    { code: `const el = <button>{'‹'}</button>` },
    { code: `const el = <span>{'·'}</span>` },
    // Whitespace between elements
    { code: `const el = <div>\n  <p>{t(s.season_week)}</p>\n</div>` },
    // aria-label from the strings module
    { code: `const el = <button aria-label={t(s.week_next)}>{'›'}</button>` },
    // Non-string literals are not text
    { code: `const el = <Card colonyName={null} />` },
    { code: `const el = <p>{null}</p>` },
    { code: `const el = <p>{count ?? 0}</p>` },
    // Opt-out: configured exception, matched after trimming surrounding whitespace
    {
      code: `const el = (\n  <button>\n    DE\n  </button>\n)`,
      options: [{ allow: ['DE', 'EN'] }],
    },
    // Opt-out: disable comment with a stated reason. RuleTester registers the
    // rule under `rule-to-test/`, so that is the name the comment must carry.
    {
      code: `const el = (\n  // eslint-disable-next-line rule-to-test/no-hardcoded-ui-text -- language codes are identical in both locales\n  <button>EN</button>\n)`,
    },
  ],
  invalid: [
    {
      code: `const el = <p>Week</p>`,
      errors: [{ messageId: 'hardcodedText', data: { text: 'Week' } }],
    },
    {
      code: `const el = <p>{'Not enough data'}</p>`,
      errors: [{ messageId: 'hardcodedText', data: { text: 'Not enough data' } }],
    },
    {
      code: `const el = <p>{'lower ▾'}</p>`,
      errors: [{ messageId: 'hardcodedText', data: { text: 'lower ▾' } }],
    },
    {
      code: `const el = <button aria-label="Delete entry">×</button>`,
      errors: [{ messageId: 'hardcodedText', data: { text: 'Delete entry' } }],
    },
    {
      code: `const el = <img alt="Bee on comb" src={src} />`,
      errors: [{ messageId: 'hardcodedText', data: { text: 'Bee on comb' } }],
    },
  ],
})
