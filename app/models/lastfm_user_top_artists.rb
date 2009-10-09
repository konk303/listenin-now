class LastFmUserTopArtists
  include DataMapper::Resource

#   EXPIRE = 60 * 60 * 24 * 7 # can be cached for 1 week
  EXPIRE = 60 # can be cached for 1 minute

  property :user, String, :key => true
  property :artists, List
  property :data, Text
  property :container, String
  property :updater_id, String
  property :updater_name, String
  property :created_at, Time, :default => Time.new
  property :updated_at, Time

  before :save do
    self.updated_at = Time.new
  end

  def self.get_unexpired user
    first(:updated_at.gt => Time.new - EXPIRE, :user => user)
  end
end
