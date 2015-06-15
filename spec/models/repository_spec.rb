require 'rails_helper'

describe Repository do

  let(:repo) { Repository.create!(full_name: 'jeromegn/documentup') }

  describe '#refresh_config' do
    before { repo.refresh_config }
  end

end