class Repository::Configuration::Matomo
  include Virtus.model

  attribute :domain, String
  attribute :tracking_id, String
end