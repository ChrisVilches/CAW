const fs = require('fs');
const scrapper = require('../scrapper');

describe('Scraper', function () {
  it('scraps enough data', function () {

    let result;

    let 張り合う = scrapper.scrapWordAux(fs.readFileSync('spec/support/pages/張り合う.html').toString());
    expect(張り合う.extra.length).toEqual(3);
    expect(張り合う.results.length).toEqual(3);
    expect(張り合う.results[0].synonyms.length).toEqual(9);
    expect(張り合う.results[1].synonyms.length).toEqual(6);
    expect(張り合う.results[2].synonyms.length).toEqual(19);

    let 思い = scrapper.scrapWordAux(fs.readFileSync('spec/support/pages/思い.html').toString());
    expect(思い.extra.length).toEqual(3);
    expect(思い.results.length).toEqual(15);
    expect(思い.results[0].synonyms.length).toEqual(17);
    expect(思い.results[1].synonyms.length).toEqual(9);
    expect(思い.results[2].synonyms.length).toEqual(20);
    // ...
    expect(思い.results[14].synonyms.length).toEqual(6);


  });
});
