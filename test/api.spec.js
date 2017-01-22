const assert = require('power-assert');
const child_process = require('child_process');
const fs = require('fs');
const https = require('https');
const sinon = require('sinon');

const api = require('../index.js');

const backetURL = 'https://s3-ap-northeast-1.amazonaws.com/aws-lambda-bins';

describe('API', () => {
  describe('.set()', () => {
    afterEach(() => api.resetOptions());

    it('should update options', () => {
      api.set({verify: true});
      assert(api.options.verify === true);
    });
  });

  describe('.install', () => {
    const originalPATH = process.env.PATH;
    beforeEach(() => sinon.stub(api, 'download'));
    afterEach(() => {
      process.env.PATH = originalPATH
      api.download.restore();
    });

    describe('.use({bin: "git"})', () => {
      it('should setup environment for the latest Git', () => {
        const callback = sinon.stub();
        api.install({bin: "git"}, callback);

        assert(process.env.PATH === `/tmp/usr/bin:${originalPATH}`);
        const url = `${backetURL}/git/git-master.tar.gz`;
        assert(api.download.withArgs(url, callback));
      });
    });

    describe('.use({bin: "git", tag: "v2.11.0"})', () => {
      it('should setup environment for Git v2.11.0', () => {
        const callback = sinon.stub();
        api.install({bin: "git", tag: "v2.11.0"}, callback);

        assert(process.env.PATH === `/tmp/usr/bin:${originalPATH}`);
        const url = `${backetURL}/git/git-v2.11.0.tar.gz`;
        assert(api.download.withArgs(url, callback));
      });
    });
  });

  describe('.download()', () => {
    beforeEach(() => {
      const close = { on: (e, callback) => callback() };
      sinon.stub(https, 'get', () => close);
    });
    afterEach(() => https.get.restore());

    context('/tmp/vendor/filename not exists', () => {
      beforeEach(() => {
        sinon.stub(child_process, 'exec', (_command, callback) => callback());
        sinon.stub(fs, 'mkdir', (_path, callback) => callback());
        sinon.stub(fs, 'stat', (_path, callback) => callback('no such file or directory'));
      });
      afterEach(() => {
        child_process.exec.restore();
        fs.mkdir.restore();
        fs.stat.restore();
      });

      it('should download a file from url', (done) => {
        const url = `${backetURL}/git/git-master.tar.gz`;
        api.download(url, done);

        assert(child_process.exec.calledWith('tar -C /tmp -xf vendor/git-master.tar.gz'));
        assert(fs.mkdir.calledWith('/tmp/vendor'));
        assert(fs.stat.calledWith('/tmp/vendor/git-master.tar.gz'));
        assert(https.get.calledWith(url));
      });
    });

    context('/tmp/vendor/filename already exists', () => {
      beforeEach(() => {
        sinon.stub(fs, 'mkdir', (_path, callback) => callback());
        sinon.stub(fs, 'stat', (_path, callback) => callback());
      });
      afterEach(() => {
        fs.mkdir.restore();
        fs.stat.restore();
      });

      it('should not download', (done) => {
        api.download(`${backetURL}/git/git-master.tar.gz`, done);

        assert(fs.mkdir.calledWith('/tmp/vendor'));
        assert(fs.stat.calledWith('/tmp/vendor/git-master.tar.gz'));
        assert(https.get.called === false);
      });
    });
  });
});
