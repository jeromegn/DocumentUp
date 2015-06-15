class RepositoriesController < ApplicationController
  protect_from_forgery except: :show
  def show
    render_page
  end
  def recompile
    current_page.process
    redirect_to user_repository_page_path(path: '')
  end
end