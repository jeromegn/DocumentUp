set :stages, %w(production)
require 'capistrano/ext/multistage'

set :application, "node"
set :user, "ubuntu"
set :host, "ec2-23-21-199-63.compute-1.amazonaws.com"
set :deploy_to, "/var/www/node"
set :use_sudo, true
set :admin_runner, "ubuntu"

set :scm, :git
set :repository, "git@github.com:jeromegn/DocumentUp.git"
set :branch, "master"

set :deploy_via, :remote_cache
role :app, host


default_run_options[:pty] = true

namespace :deploy do
  task :start, :roles => :app, :except => { :no_release => true } do
    run "#{try_sudo :as => 'root'} bluepill start #{application}"
  end

  task :stop, :roles => :app, :except => { :no_release => true } do
    run "#{try_sudo :as => 'root'} bluepill stop #{application}"
  end

  task :restart, :roles => :app, :except => { :no_release => true } do
    run "#{try_sudo :as => 'root'} bluepill restart #{application}"
  end

  task :create_deploy_to_with_sudo, :roles => :app do
    run "#{try_sudo :as => 'root'} mkdir -p #{deploy_to}"
    run "#{try_sudo :as => 'root'} chown -R ubuntu:ubuntu #{deploy_to}"
  end

  task :npm_install, :roles => :app, :except => { :no_release => true } do
    run "cd #{release_path} && npm install"
  end
end

before 'deploy:setup', 'deploy:create_deploy_to_with_sudo'
after 'deploy:finalize_update', 'deploy:npm_install'