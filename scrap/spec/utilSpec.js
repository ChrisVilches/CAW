const fs = require('fs');
const util = require('../util');

describe('Util', function () {

  it('removes duplicates correctly', function(){
    expect(util.removeDuplicates([1, 2, 3, 3, 4]).sort()).toEqual([1, 2, 3, 4]);
    expect(util.removeDuplicates([1, 2, 3, 3, 4, 4]).sort()).toEqual([1, 2, 3, 4]);
    expect(util.removeDuplicates([3, 2, 3, 3, 4]).sort()).toEqual([2, 3, 4]);
  });

  it('cleans and filter words from Wiki correctly', function () {
    let words = ["aa", "bb", "cc,a", "aa・asd", "hello(a)", "xiao（asd）", "haha、334", "boo/m", "bo/om", "bb", "aa"];
    let processed = util.wikiFilterCleanWords(words, "xiao");
    expect(processed).toEqual(["aa", "bb", "cc", "hello", "haha", "boo", "bo"]);
  });

  it('trims japanese space characters correctly (doesn\'t belong here though)', function () {
    expect(" aaa ".trim()).toEqual("aaa");
    expect(" aaa 　\u3000　".trim()).toEqual("aaa");
    expect(" aaa v　\u3000 　\u3000 \u3000 ".trim()).toEqual("aaa v");
    expect("　 　 aaa 　".trim()).toEqual("aaa");
    expect("\u3000桂川駅 \u3000".trim()).toEqual("桂川駅");
  });
});
