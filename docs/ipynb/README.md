# IPYNB MD Notes

Each notebook should start with a yaml cell. Processing instructions can be modified on a per-cell basis.

## Yaml

Typically looks like:

```
# Page Header
> A brief description of what this page has to offer.

- key: value
- anotherKey: anotherVvalue
```

Possible Key's: Sample Values

- `keywords`: ['seo_term', 'another_term]
- `meta.prettify: true`
- `hide: true`

## Cell Flags

- `%%javascript`: will rm the input and display output if not error
- `#input_show`: equivilant to %%javascript but saves input
- `%%capture`
- `hide `

```
((note:footnote content))
(((warning::Some warning message)))
(((tip::Some tip message)))
(((info::Some info message)))
```

## Text Decorators

- `(((note:: footnote content)))`
- `(([blockquote content]))`

labs nb2html tests
labs intern preface
labs 09_looking_at_data
labs details

cleanup lights_notes
data play lib needs fixin
dataplay lib has three ipynb

fix up tables
%%capture will not show input source

## Misc

- Prefix a ipynb file with `_` to have it be excluded from the sitemap and processing.
