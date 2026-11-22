# Porraslaskurin kehitysohje

## Työnjako aliagenteille

- Käytä aliagentteja, kun käyttäjä tai soveltuva työohje pyytää rinnakkaista työtä ja istunto tukee sitä. Jaa työ itsenäisiin osiin, kuten laskurin muutos, laskennan riippumaton tarkistus tai selaintesti.
- Nimeä jokaiselle tehtävä, tiedostot tai alue, odotettu tulos ja tarvittava testi. Sovi yksi kirjoittaja kutakin tiedostoa tai elävää tilausriviä kohti. Anna tarkistajalle lähtöarvot ja pyydä tarkistus ilman tiedostomuutoksia.
- Pääagentti vertaa havaintoja, selvittää ristiriidat, kokoaa muutokset ja tarkistaa lopputuloksen ennen käyttäjälle raportointia. Kirjaa toteutuneet testit ja avoimet kohdat PR:ään tai soveltuvaan GitHub-tehtävään.

## Skillit

- Valitse skilli työn mukaan. Lue sen `SKILL.md` ja tehtävän kannalta olennaiset viitteet ennen toteutusta. Jos käyttäjä nimeää skillin, etsi ja käytä sitä, kun se on saatavilla.
- Käytä selaintestausta käyttöpolun tarkistamiseen, taulukko-ohjeita natiivin seurannan käsittelyyn ja teknistä tarkistusta mitoitukseen. Kerro, jos tarvittava skilli tai testiväline puuttuu.
- Kun työnkulku toistuu, kirjaa projektin pysyvät käytännöt tähän tiedostoon. Pakkaa toistettava työvaihe omaksi skilliksi, kun sille on rajattu käyttötarkoitus ja tarkistettava lopputulos.

## Tarkistukset ennen muutoksen hyväksymistä

1. Käytä julkisessa laskurissa ja repossa demotietoja. Vertaa mitoitusmuutoksessa laskurin tulosta lähtöarvoista itsenäisesti laskettuun tulokseen. Pyöristä vasta esitysvaiheessa. Tarkista rajatapaukset ja molemmat kätisyydet, jos muutos vaikuttaa niihin.
2. Tarkista muutoksen vaikutus pohjissa, leikkauksissa ja vienneissä. Mitoille pitää näkyä mittauksen alku- ja loppupiste sekä yksikkö. Merkitse työmaalla varmistettava mitta avoimeksi, kun lähtötieto puuttuu.
3. Tarkista selaimessa muutettu käyttöpolku. Jos muutos koskee puhelinta, testaa mobiilinäkymä. Kirjaa erikseen, testattiinko oikealla laitteella vai selaimen mobiilinäkymässä.
4. Testaa tilaustyönkulussa sekä oikea eteneminen että virhetilat. Varmista, että laskuluonnos ei avaa maksukuittausta ja että puuttuva tai virheellinen päivämäärä pitää seuraavan vaiheen lukittuna. Käytä simuloituja kuittauksia.
5. Tarkista ennen julkaisua, että PR:n sisältö rajautuu tehtävään ja että tulokset voi toistaa. Näytä raportissa testattu, korjattava ja tarkistamatta jäänyt kohta erikseen.

## Julkinen repo ja yksityinen työ

- Julkiseen repoon kuuluvat laskurin koodi, yleiset ohjeet ja demo. Säilytä todellisten kohteiden mallit, sahauslistat, asiakastiedot, tilaus- ja laskutiedot sekä yksityiset jakolinkit käyttöoikeuksin rajatussa työtilassa.
- Tilaustestin aikana laskut tallennetaan luonnoksiksi ja tapahtumat merkitään testiksi. Oikeita laskuja, tavaratilauksia tai toimittaja-aineistoa lähetetään vain käyttäjän erillisellä luvalla.
- Tee muutos rajatussa haarassa tai luonnos-PR:ssä, kun tuotantoon ei ole pyydetty julkaisua.
