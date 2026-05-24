# Routing

Juris uses product paths:

- `/[locale]` -> public
- `/[locale]/login` -> identity
- `/[locale]/console` -> console
- `/[locale]/admin` -> admin
- `/[locale]/billing` -> billing
- `/[locale]/reports` -> reporting
- `/[locale]/settings` -> settings
- `/[locale]/support` -> support

Locales are `en`, `sw`, and `fr`. Each app can run directly on its own port, while the local gateway proxies cohesive paths from port 3000.
