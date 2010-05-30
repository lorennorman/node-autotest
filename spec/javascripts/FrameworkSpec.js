describe('Framework', function () {
  it('should have a passing test', function() {
    expect(true).toEqual(true);
  });

  describe('nested describe', function () {
    it('should not throw an exception when start() is called', function () {
      Framework.start();
    });
  });
});