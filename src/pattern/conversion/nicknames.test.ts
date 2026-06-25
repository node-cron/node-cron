import { resolveNickname } from './nicknames';

describe('resolveNickname', function () {
    it('@yearly resolves to 0 0 1 1 *', function () {
        expect(resolveNickname('@yearly')).toBe('0 0 1 1 *');
    });

    it('@annually resolves to 0 0 1 1 *', function () {
        expect(resolveNickname('@annually')).toBe('0 0 1 1 *');
    });

    it('@monthly resolves to 0 0 1 * *', function () {
        expect(resolveNickname('@monthly')).toBe('0 0 1 * *');
    });

    it('@weekly resolves to 0 0 * * 0', function () {
        expect(resolveNickname('@weekly')).toBe('0 0 * * 0');
    });

    it('@daily resolves to 0 0 * * *', function () {
        expect(resolveNickname('@daily')).toBe('0 0 * * *');
    });

    it('@midnight resolves to 0 0 * * *', function () {
        expect(resolveNickname('@midnight')).toBe('0 0 * * *');
    });

    it('@hourly resolves to 0 * * * *', function () {
        expect(resolveNickname('@hourly')).toBe('0 * * * *');
    });

    it('is case-insensitive', function () {
        expect(resolveNickname('@Daily')).toBe('0 0 * * *');
        expect(resolveNickname('@YEARLY')).toBe('0 0 1 1 *');
    });

    it('passes through regular expressions unchanged', function () {
        expect(resolveNickname('*/5 * * * *')).toBe('*/5 * * * *');
    });

    it('passes through unknown nicknames unchanged', function () {
        expect(resolveNickname('@unknown')).toBe('@unknown');
    });
});
