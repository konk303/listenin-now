# appengine-jrubyのDataMapperを使用する場合の文字化け対策用パッチ
# Text対応版 by 殊海夕音
# original: http://d.hatena.ne.jp/yuum3/20090803/1249308751

module AppEngine
  module Datastore
    def Datastore.ruby_to_java(value)  # :nodoc:
      if SPECIAL_RUBY_TYPES.include? value.class
        value.to_java
      else
        case value
        when Fixnum
          java.lang.Long.new(value)
        when Float
          java.lang.Double.new(value)
        when String
          #value.to_java_string
          # Thanks http://d.hatena.ne.jp/milk1000cc/20090802/1249218370
          java.lang.String.new(value) 
        else
          value
        end
      end
    end
    class Text < String
      def to_java
        #JavaDatastore::Text.new(self.to_java_string)
        JavaDatastore::Text.new(java.lang.String.new(self.to_s))
      end
      def self.new_from_java(text)
        self.new(text.getValue)
      end
    end
  end
end
