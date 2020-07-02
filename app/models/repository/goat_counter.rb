class Repository::GoatCounter
  include Virtus.model
  
  attribute :domain, String
  attribute :script, String, default: "//gc.zgo.at/count.js"
end