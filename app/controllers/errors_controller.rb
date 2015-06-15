class ErrorsController < ApplicationController
  skip_before_action :ensure_repository!, :ensure_page!

  layout 'error'

  def not_found
    render status: 404
  end

  def internal_server_error
    render status: 500
  end
end
