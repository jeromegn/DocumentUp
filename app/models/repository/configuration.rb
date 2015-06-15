class Repository::Configuration
  include Virtus.model
  attribute :name, String
  attribute :color, String
  attribute :theme, String
  attribute :issues, Boolean, default: true
  attribute :travis, Boolean, default: false
  attribute :twitter, String, default: ""
  attribute :google_analytics, String, default: nil
  attribute :github_ribbon, Boolean, default: true

  def self.load(obj)
    new(obj)
  end

  def twitter
    t = super
    return [] if t.blank?
    t.is_a?(Array) ? t : [JSON.parse(t)].flatten
  rescue JSON::ParserError => exception
    [t]
  end

  def self.dump(obj)
    unless obj.is_a?(self)
      raise ::ActiveRecord::SerializationTypeMismatch,
        "Attribute was supposed to be a #{self}, but was a #{obj.class}. -- #{obj.inspect}"
    end
    obj.to_h
  end
end