Rails.application.routes.draw do
  get '/', to: redirect('/jeromegn/documentup')
  post :recompile, to: 'github#push', as: :github_push

  get '/stylesheets/screen.css', to: redirect('/assets/application.css')

  resources :users, path: '', param: :login, only: [] do
    resources :repositories, path: '', param: :name, constraints: {name: /([A-Za-z0-9\._-]*)/}, only: [:show] do
      get :__recompile, to: 'repositories#recompile', as: :recompile
      resources :pages, param: :path, path: '', constraints: {path: /.*/}, only: [:show]
    end
  end

  get '404', to: "errors#not_found"
  get '500', to: "errors#internal_server_error"
end
