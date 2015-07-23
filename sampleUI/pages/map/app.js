require([
  "esri/map",
  "esri/request",
  "esri/graphic",
  "esri/Color",

  "esri/geometry/Point",

  "esri/symbols/SimpleMarkerSymbol",
  "esri/symbols/SimpleLineSymbol",

  "esri/layers/FeatureLayer",

  "esri/dijit/PopupTemplate",

  "dojo/dom",
  "dojo/on",
  "dojo/dom-style",
  "dojo/dom-attr",
  "dojo/domReady!"
], function(
  Map, esriRequest, Graphic, Color,
  Point,
  SimpleMarkerSymbol, SimpleLineSymbol,
  FeatureLayer,
  PopupTemplate,
  dom, on, domStyle, domAttr
) {

  var map, geoData, homeCoordinates,
  fixturesFeatureLayer, fixturesPopupTemplate, fixturesUrl;

  map = new Map("map", {
    basemap: "dark-gray"
  });

  map.on("load", goHome);

  var featureCollection = {
    "layerDefinition": null,
    "featureSet": {
      "features": [],
      "geometryType": "esriGeometryPoint"
    }
  };

  featureCollection.layerDefinition = {
    "geometryType": "esriGeometryPoint",
    "objectIdField": "ObjectID",
    "drawingInfo": {
      "renderer": {
        "type": "simple",
        "symbol": {
          "type": "esriSMS",
          "color": [231, 76, 60, 255],
          "size": 30,
          "style": "esriSMSCircle",
          "outline": {
            "color": [255, 255, 255, 255],
            "width": 5,
            "type": "esriSLS",
            "style": "esriSLSSolid"
          }
        }
      }
    },
    "fields": [{
      "name": "ObjectID",
      "alias": "ObjectID",
      "type": "esriFieldTypeOID"
    }, {
      "name": "description",
      "alias": "Description",
      "type": "esriFieldTypeString"
    }, {
      "name": "title",
      "alias": "Title",
      "type": "esriFieldTypeString"
    }]
  };

  fixturesPopupTemplate = new PopupTemplate({
    title: "{title}",
    description: "{description}"
  });

  fixturesFeatureLayer = new FeatureLayer(featureCollection, {
    id: "fixturesFeatureLayer",
    infoTemplate: fixturesPopupTemplate
  });

  var block = dom.byId("block");
  var leagueBlock = dom.byId("league-block");
  var epl = dom.byId("epl");
  var ucl = dom.byId("ucl");
  var friendlies = dom.byId("friendlies");
  var fixtures = dom.byId("fixtures");
  var stats = dom.byId("stats");
  var goBack = dom.byId("goBack");

  on(epl, "click", function() {
    domStyle.set(block, "display", "none");
    domStyle.set(leagueBlock, "display", "block");
    domAttr.set(fixtures, "data-league", "epl");
    domAttr.set(stats, "data-league", "epl");
  });

  on(goBack, "click", function() {
    domStyle.set(block, "display", "block");
    domStyle.set(leagueBlock, "display", "none");
    domAttr.set(fixtures, "data-league", "");
    domAttr.set(stats, "data-league", "");
  });

  on(fixtures, "click", function() {
    console.log("requesting fixtures...");
    var league = domAttr.get(fixtures, "data-league");
    if (league === "epl") {
      fixturesUrl = "data/fixtures/epl.json";
    } else if (league === "ucl") {
      fixturesUrl = "data/fixtures/ucl.json";
    } else if (league === "friendlies") {
      fixturesUrl = "data/fixtures/friendlies.json";
    }
    map.addLayer(fixturesFeatureLayer);
  });

  map.on("layer-add-result", function(result){
    console.log("requesting fixtures...");
    requestFixtures();
  });

  function requestFixtures() {
    var requestHandle = esriRequest({
      url: fixturesUrl
    });
    requestHandle.then(fixtruesRequestSucceeded, fixtruesRequestFailed);
  }

  function fixtruesRequestSucceeded(response) {
    console.log("getting fixture request response...");
    var features = [];
    console.log(response);

    response.forEach(function(fixture){
      var attr = {};
      attr.description = fixture.date + " " + fixture.time;
      attr.title = fixture.team + " (" + fixture.type + ")";

      var geometry = new Point(geoData[fixture.team]);

      var graphic = new Graphic(geometry);
      graphic.setAttributes(attr);

      features.push(graphic);
    });

    fixturesFeatureLayer.applyEdits(features, null, null);
    map.setZoom(7);
  }

  function fixtruesRequestFailed(response) {
    console.log("fixture request failed...");
  }

  var sms = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, 30,
    new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
      new Color([255, 255, 255]), 5),
    new Color("#f06060"));

  function goHome() {
    var geoDataHandle = getGeoData();
    geoDataHandle.then(geoDataRequestSucceeded, geoDataRequestFailed);
  }

  function getGeoData() {
    console.log("sending request...");
    return esriRequest({
      url: "http://mbalumuri.esri.com:8080/manchesterUnited/data/geoData.json"
    });
  }

  function geoDataRequestSucceeded(response) {
    console.log(response);
    geoData = response;
    homeCoordinates = new Point(geoData["Manchester United"]);
    map.centerAt(homeCoordinates).then(
      function doneMoving() {
        map.setZoom(10).then(pointHome);
      }
    );
  }

  function geoDataRequestFailed() {
    console.log("request failed...");
  }

  function pointHome() {
    var graphic = new Graphic(homeCoordinates, sms);
    map.graphics.add(graphic);
  }

});
