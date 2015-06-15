class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception
  before_action :ensure_repository!, :ensure_page!
  helper_method :current_page, :current_repository

  def full_repository
    "#{params[:user_login]}/#{params[:repository_name] || params[:name]}".downcase
  end

  def current_repository
    @current_repository ||= begin
      repo = Repository.find_or_create_by(full_name: full_repository)
      if params[:config]
        repo.config = Repository::Configuration.new(JSON.parse(params[:config]))
        repo.save
      end
      repo
    end
  end

  def ensure_repository!
    raise ActionController::RoutingError.new('Not Found') if current_repository.blank?
  end

  def current_page
    @current_page ||= Page.find_or_create_by(repository: current_repository, path: params[:page_path] || params[:path] || '')
  end

  def ensure_page!
    raise ActionController::RoutingError.new('Not Found') if current_page.blank?
  end

  def render_page
    respond_to do |format|
      format.json do
        html = render_to_string(template: 'pages/show.html.slim', layout: 'application')
        render json: { status: 200, html: html }, callback: params[:callback]
      end
      format.html { render 'pages/show' }
    end
  end
end
