class Update
  include DataMapper::Resource

  property :id, Serial
  property :title, String
  property :body, Text
  property :date, Time
  property :author, String
  property :display, Boolean, :default => false
  property :created_at, Time, :default => Time.new
  property :updated_at, Time

  default_scope(:default).update(:order => [:date.desc])

  before :save do
    self.updated_at = Time.new
    self.author = AppEngine::Users.current_user.nickname
  end

  def self.all_display
    all(:display => true)
  end
end
