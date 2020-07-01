class Repository::Plausible
  include Virtus.model

  attribute :domain, String
  attribute :script, String, default: "https://plausible.io/js/plausible.js"
end