class ApplicationController < ActionController::Base
  # Prevent CSRF attacks by raising an exception.
  # For APIs, you may want to use :null_session instead.
  protect_from_forgery with: :exception
  before_action :ensure_repository!, :ensure_page!
  helper_method :current_page, :current_repository, :current_config

  def full_repository
    if Subdomain.matches? request
      splitted = request.subdomain.split('.')
      params[:user_login] = splitted.pop
      params[:repository_name] = splitted.join(".")
    end
    "#{params[:user_login]}/#{params[:repository_name] || params[:name]}".downcase
  end

  def current_repository
    @current_repository ||= Repository.where('LOWER(full_name) = ?', full_repository).first_or_create(full_name: full_repository)
  rescue Octokit::NotFound => exception
    Rails.logger.info "Could not find repository #{full_repository}"
    nil
  end

  def current_config
    @current_config ||= params[:config].present? ? Repository::Configuration.new(params[:config].is_a?(String) ? JSON.parse(params[:config]) : params[:config]) : current_repository.config
  end

  def ensure_repository!
    raise ActionController::RoutingError.new('Not Found') if current_repository.blank?
  end

  def current_page
    @current_page ||= Page.find_or_create_by(repository: current_repository, path: params[:page_path] || params[:path] || '')
  rescue Octokit::NotFound => exception
    Rails.logger.info "Could not find page #{params[:page_path] || params[:path]}"
    nil
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
