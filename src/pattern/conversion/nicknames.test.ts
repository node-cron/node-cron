import { assert } from 'chai';
import { resolveNickname } from './nicknames';

describe('resolveNickname', function () {
    it('@yearly resolves to 0 0 1 1 *', function () {
        assert.equal(resolveNickname('@yearly'), '0 0 1 1 *');
    });

    it('@annually resolves to 0 0 1 1 *', function () {
        assert.equal(resolveNickname('@annually'), '0 0 1 1 *');
    });

    it('@monthly resolves to 0 0 1 * *', function () {
        assert.equal(resolveNickname('@monthly'), '0 0 1 * *');
    });

    it('@weekly resolves to 0 0 * * 0', function () {
        assert.equal(resolveNickname('@weekly'), '0 0 * * 0');
    });

    it('@daily resolves to 0 0 * * *', function () {
        assert.equal(resolveNickname('@daily'), '0 0 * * *');
    });

    it('@midnight resolves to 0 0 * * *', function () {
        assert.equal(resolveNickname('@midnight'), '0 0 * * *');
    });

    it('@hourly resolves to 0 * * * *', function () {
        assert.equal(resolveNickname('@hourly'), '0 * * * *');
    });

    it('is case-insensitive', function () {
        assert.equal(resolveNickname('@Daily'), '0 0 * * *');
        assert.equal(resolveNickname('@YEARLY'), '0 0 1 1 *');
    });

    it('passes through regular expressions unchanged', function () {
        assert.equal(resolveNickname('*/5 * * * *'), '*/5 * * * *');
    });

    it('passes through unknown nicknames unchanged', function () {
        assert.equal(resolveNickname('@unknown'), '@unknown');
    });
});
