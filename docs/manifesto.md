# Koala Manifesto

- **Koala is not a framework**

  It empowers developers to quickly develop SEEK web services using [Koa](https://github.com/koajs/koa) using whatever structure they see fit.

- **Koala does not wrap other packages**

  The objects and types of JavaScript packages such as [Axios](https://github.com/axios/axios) and [hot-shots](https://github.com/brightcove/hot-shots) should be used directly.
  While Koala may provide constructors for objects from those packages developers should always be able to "bring their own instance".

- **Koala does not contain policy**

  It does not enforce timeouts, set caching headers, expect certain error objects, etc.
  Whenever a default policy is unavoidable it should be called out in the documentation and be made configurable.

- **Koala modules should be usable in isolation**

  An application should not have to "buy in" to all of Koala at once.
  Modules should not require special middleware to set up their state.

- **Koala is not innovative**

  It implements best practices from SEEK and follows [internal SEEK RFCs](https://github.com/SEEK-Jobs/rfc) and [s2sauth](https://github.com/SEEK-Jobs/s2sauth) where applicable.
  The modular, policy-free nature of Koala allows individual apps to opt-out of Koala's implementation for experimentation.

- **Koala is not a dumping ground**

  It strictly contains functionality related to developing Koa web services within SEEK.
  It should not include features only relevant to a single application or team.
