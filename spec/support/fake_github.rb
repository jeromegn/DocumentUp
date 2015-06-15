require 'sinatra/base'

class FakeGitHub < Sinatra::Base
  set :show_exceptions, false
  set :dump_errors, true

  get '/repos/:login/:repo' do
    json_response 200, "repos/#{params[:login].downcase}/#{params[:repo].downcase}"
  end

  get '/repos/:login/:repo/git/trees/:branch' do
    json_response 200, "repos/#{params[:login].downcase}/#{params[:repo].downcase}/git/tree/#{params[:branch]}"
  end

  get '/repos/:login/:repo/contents/*' do
    content_type :text
    fixture("repos/#{params[:login].downcase}/#{params[:repo].downcase}/contents/#{params[:splat].join('/')}")
  end

  private

  def fixture(file_name)
    File.open(File.dirname(__FILE__) + '/fixtures/' + file_name, 'rb').read
  end

  def json_fixture(file_name)
    file_name += ".json" unless file_name.ends_with?('.json')
    fixture(file_name)
  end

  def json_response(response_code, file_name)
    content_type :json
    status response_code
    json_fixture(file_name)
  end
end