describe('Instantiation', function(){
  describe('Without any parameter', function(){
    it('should throw an error', function(){
      try {
        DocumentUp.document()
      } catch(err) {
        err.message.should.equal("Repository required with format: username/repository");
      }
    });
  });
});