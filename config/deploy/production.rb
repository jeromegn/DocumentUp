set :node_env, 'production'
set :branch, 'master'
set :keep_releases, 10

server 'ec2-23-21-199-63.compute-1.amazonaws.com', :web, :app, :db, :primary => true