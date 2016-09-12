'use strict';
var locations = {
dublinbay: {key: "dublinbay", metocean: true, mmsi: "992501301", name: "Dublin Bay Buoy"},
fastnet: {key: "fastnet", metocean: true, mmsi: "992501123", name: "Fastnet"},
coningbeg: {key: "coningbeg", metocean: true, mmsi: "992501074", name: "Coningbeg"},
splaugh: {key: "splaugh", metocean: true, mmsi: "992501062", name: "Splaugh"},
kishbank: {key: "kishbank", metocean: true, mmsi: "992501017", name: "Kish Bank"},
southhunter: {key: "southhunter", metocean: true, mmsi: "992351007", name: "South Hunter"},
foyle: {key: "foyle", metocean: true, mmsi: "992501230", name: "Foyle"},
finnis: {key: "finnis", metocean: true, mmsi: "992501164", name: "Finnis"},
ballybunnion: {key: "ballybunnion", metocean: true, mmsi: "992501146", name: "Ballybunnion"},
wt2buoy: {key: "wt2buoy", metocean: true, mmsi: "992501304", name: "WT 2 Buoy"},
eastkish: {key: "eastkish", name: "East Kish", type: "Buoy", position: "53°14.349'N, 005°53.618'W", mmsi:"992501020" },
moulditch: {key: "moulditch", name: "Moulditch", type: "Buoy", position: "53°08.430'N, 006°01.230'W", mmsi:"992501022" },
southindia: {key: "southindia", name: "South India", type: "Buoy", position: "53°00.349'N, 005°53.346'W", mmsi:"992501030" },
wicklowhead: {key: "wicklowhead", name: "Wicklow Head", type: "Lighthouse", position: "52°57.947'N,  005°59.889'W", mmsi:"992501031" },
glassgorman2: {key: "glassgorman2", name: "No.2 Glassgorman", type: "Buoy", position: "52°45.348'N, 006°05.343'W", mmsi:"992501038" },
northblackwater: {key: "northblackwater", name: "North Blackwater", type: "Buoy", position: "52°32.225'N, 006°09.520'W", mmsi:"992501046" },
rusk1: {key: "rusk1", name: "No.1 Rusk", type: "Buoy", position: "52°28.539'N, 006°11.799'W", mmsi:"992501048" },
rochespoint: {key: "rochespoint", name: "Roches Point", type: "Lighthouse", position: "51°47.586'N, 008°15.287'W", mmsi:"992501099" },
daunt: {key: "daunt", name: "Daunt", type: "Buoy", position: "51°43.531'N, 008°17.665'W", mmsi:"992501102" },
bulman: {key: "bulman", name: "Bulman", type: "Buoy", position: "51°40.136'N, 008°29.739'W", mmsi:"992501104" },
blacktom: {key: "blacktom", name: "Black Tom", type: "Buoy", position: "51°36.408'N, 008°37.959'W", mmsi:"992501110" },
loo: {key: "loo", name: "Loo", type: "Buoy", position: "51°28.438'N, 009°23.458'W", mmsi:"992501119" },
mizen: {key: "mizen", name: "Mizen", type: "Lighthouse", position: "51°26.991'N, 009°49.225'W", mmsi:"992501127" },
walterscott: {key: "walterscott", name: "Walter Scott", type: "Buoy", position: "51°38.541'N, 009°54.234'W", mmsi:"992501128" },
maidenrock: {key: "maidenrock", name: "Maiden Rock", type: "Buoy", position: "51°49.023'N, 009°48.034'W", mmsi:"992501134" },
cromwellpoint: {key: "cromwellpoint", name: "Cromwell Point", type: "Lighthouse", position: "51°56.022'N, 010°19.280'W", mmsi:"992501141" },
foot: {key: "foot", name: "Foot", type: "Buoy", position: "51°55.718'N, 010°17.072'W", mmsi:"992501140" },
doonaha: {key: "doonaha", name: "Doonaha", type: "Buoy", position: "52°35.545'N, 009°39.014'W", mmsi:"992501154" },
cannonrock: {key: "cannonrock", name: "Cannon  Rock", type: "Buoy", position: "53°14.078'N, 009°34.352'W", mmsi:"992501173" },
cashlabay: {key: "cashlabay", name: "Cashla Bay", type: "Lighthouse", position: "53°15.834'N, 009°33.982'W", mmsi:"992501171" },
eeragh: {key: "eeragh", name: "Eeragh", type: "Lighthouse", position: "53°08.909'N, 009°51.402'W", mmsi:"992501172" },
carrickpatrick: {key: "carrickpatrick", name: "Carrickpatrick", type: "Buoy", position: "54°15.557'N, 009°09.141'W", mmsi:"992501192" },
blackrocksligo: {key: "blackrocksligo", name: "Blackrock Sligo", type: "Lighthouse", position: "54°18.460'N, 008°37.059'W", mmsi:"992501195" },
wheatrock: {key: "wheatrock", name: "Wheat Rock", type: "Buoy", position: "54°18.843'N, 008°39.099'W", mmsi:"992501196" },
ruepoint: {key: "ruepoint", name: "Rue Point", type: "Lighthouse", position: "55°15.533'N, 006°11.474'W", mmsi:"992351131" },
southbriggs: {key: "southbriggs", name: "South Briggs", type: "Buoy", position: "54°41.182'N, 005°35.732'W", mmsi:"992351133" },
governor: {key: "governor", name: "Governor", type: "Buoy", position: "54°39.360'N, 005°31.991'W", mmsi:"992351134" },
barpladdy: {key: "barpladdy", name: "Bar Pladdy", type: "Buoy", position: "54°19.344'N, 005°30.501'W", mmsi:"992351135" },
dunany: {key: "dunany", name: "Dunany", type: "Buoy", position: "53°53.530'N, 006°09.502'W", mmsi:"992501243" },
imogene: {key: "imogene", name: "Imogene", type: "Buoy", position: "53°57.415'N, 006°07.042'W", mmsi:"992501238" }
};
exports.locations = locations;