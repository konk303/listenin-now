class Update
  include DataMapper::Resource

  property :id, Serial, :key => true
  property :title, String
  property :body, Text
  property :author, Object#AppEngine::Users::User
  property :created_at, Time#, :key => true
end
