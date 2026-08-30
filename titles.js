window.FILO_TITLES={
  Justin:'The Franchise',
  Ljah:'Agent of Chaos',
  Daniel:'Board Man',
  KT:'Paint Patrol',
  Riley:'Midrange Merchant',
  Teo:'Floor General',
  David:'The Connector',
  Eli:'Microwave',
  Jarred:'Green Light',
  Tristan:'The Pest',
  Brandon:'Freight Train',
  Xavier:'The Tank'
};
Object.entries(window.FILO_TITLES).forEach(([player,title])=>{
  if(window.FILO_DATA?.meta?.[player])window.FILO_DATA.meta[player].title=title;
});
