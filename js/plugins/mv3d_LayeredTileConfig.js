/*:
 * @plugindesc MV/Z3d Extension to configure tiles/region per layer.
 * @author Yorae Rasante
 *
 * @help This plugin allows you to change the configuration of a tile
 * depending on which layer of the map the tile is set on.
 * It allows you to set it on the tile itself, be through the tileset
 * or the map notebox, or to set regions to affect tiles on any layer
 * (originally regions only affected tiles on layer 1).
 * 
 * It is easier to visualize on MZ for it lets you put the tiles on each
 * layer at your own will, but MV also has layers. They are just set by
 * the engine. You can experiment ith this on MZ by setting it to auto.
 * Most A tiles, save for the right half of A2 and the water decorations
 * of A1, go on layer 1, these others being put on layer 2 and, as for
 * the A1 tiles, have the first water put by default under them.
 * B, C, D and E tiles are a bit more complicated, by as a rule the first
 * of the tiles placed on the map is on layer 4, and if another is put
 * over it that one goes to layer 3, the new one is now on layer 4, and
 * if there was already one on layer 3 it is removed.
 * 
 * To set the tiles to have settings for different layers, put a notebox
 * of <mv3d-layer#>, or <mz3d-layer#>, on the tileset notebox,
 * or <mv3d-layer#-tiles> or <mz3d-layer#-tiles> on the map's notes.
 * Put the number of the layer in place of the #.
 * Fill the box as you would an usual tile setting.
 * 
 * For example,
 * <mz3d-layer4-tiles>
 * A5,4,3:fringe(2)
 * </mz3d-layer1-tiles>
 * would make the tile set there have fringe 2, but only if it is on layer 4.
 * 
 * You can also make regions have a setting for layers beside 1, using notblock
 * <mv3d-layer#-regions> or <mz3d-layer#-regions>
 * 
 * <mz3d-layer3-regions>
 * 15:height(3)
 * </mz3d-layer3-regions>
 * would make any tile on layer 3 and region 15 have height of 3.
 * 
 * Important note:
 * As it is an extension, layer-set tiles for layer 1 have their configurations
 * applied after the normal region ones, meaning normal region settings do not
 * apply to them.
 * To counter this, you can also set a configuration for layer 1 on regions.
 * While usually the same as the normal region settings, they also affect
 * layer1 tile configurations.
 * 
 * */

const mv3dUnlayeredGetTileConfig = mv3d.getTileConfig;
mv3d.getTileConfig = function(t,x,y,l) {
    const conf = mv3dUnlayeredGetTileConfig.apply(this, arguments);
    if (arguments.length < 4) {
        l = y;
        y = x;
        x = t;
        t = this.getTileData(x,y)[l];
    }
    
    const tileId = this.normalizeAutotileId(t);
    if (this.isTileEmpty(tileId)) return conf;
    if (tileId in this.layeredTilesetConfigs[l]) {
        for (const side of ['top','side','inside','bottom','north','south','east','west','ceiling']){
            if (this.layeredTilesetConfigs[l][tileId][`${side}_changed`]) {
                conf[`${side}_texture`]=undefined;
                conf[`${side}_rect`]=undefined;
            }
        }
        Object.assign(conf,this.layeredTilesetConfigs[l][tileId]);
    }

    const region = this.getRegion(x,y);
	if(region && region in this._LAYER_REGION_DATA_MAP[l]){
		Object.assign(conf,this._LAYER_REGION_DATA_MAP[l][region]);
	}
    return conf;
};

const mv3dUnlayeredLoadTilesetSettings = mv3d.loadTilesetSettings;
mv3d.loadTilesetSettings = function(){
    mv3dUnlayeredLoadTilesetSettings.apply(this, arguments);
    this.layeredTilesetConfigs = [{},{},{},{}];
    let lines = this.readConfigurationBlocks($gameMap.tileset().note,'m[vz]3d-layer1')
    +'\n'+this.readConfigurationBlocks(this.getDataMap().note,'m[vz]3d-layer1-tiles');
    if (lines) this.tileLayerConfig(0, lines);
    lines = this.readConfigurationBlocks($gameMap.tileset().note,'m[vz]3d-layer2')
    +'\n'+this.readConfigurationBlocks(this.getDataMap().note,'m[vz]3d-layer2-tiles');
    if (lines) this.tileLayerConfig(1, lines);
    lines = this.readConfigurationBlocks($gameMap.tileset().note,'m[vz]3d-layer3')
    +'\n'+this.readConfigurationBlocks(this.getDataMap().note,'m[vz]3d-layer3-tiles');
    if (lines) this.tileLayerConfig(2, lines);
    lines = this.readConfigurationBlocks($gameMap.tileset().note,'m[vz]3d-layer4')
    +'\n'+this.readConfigurationBlocks(this.getDataMap().note,'m[vz]3d-layer4-tiles');
    if (lines) this.tileLayerConfig(3, lines);
};

mv3d.tileLayerConfig = function(l, lines){
    const readLines = /^\s*([abcde]\d?)\s*,\s*(\d+(?:-\d+)?)\s*,\s*(\d+(?:-\d+)?)\s*:(.*)$/gmi;
    let match;
    while(match = readLines.exec(lines)){
        const conf = this.readConfigurationFunctions(match[4],this.tilesetConfigurationFunctions);
        const range1 = match[2].split('-').map(s=>Number(s));
        const range2 = match[3].split('-').map(s=>Number(s));
        for(let kx=range1[0];kx<=range1[range1.length-1];++kx)
        for(let ky=range2[0];ky<=range2[range2.length-1];++ky){
            const key = `${match[1]},${kx},${ky}`;
            const tileId=this.constructTileId(...key.split(','));
            const appliedConf=this.applyTextureConfigs(Object.assign({},conf),match[1],kx,ky);
            if(!(tileId in this.layeredTilesetConfigs[l])){
                this.layeredTilesetConfigs[l][tileId]={};
            }
            Object.assign(this.layeredTilesetConfigs[l][tileId],appliedConf);
        }
    }
};

const mv3dUnlayeredLoadMapSettings = mv3d.loadMapSettings;
mv3d.loadMapSettings = function() {
    mv3dUnlayeredLoadMapSettings.apply(this, arguments);
    this._LAYER_REGION_DATA_MAP=[{},{},{},{}];
    const dataMap = this.getDataMap();
    //map
    let regionLayerBlocks=this.readConfigurationBlocks(dataMap.note,'m[vz]3d-layer1-regions');
    if (regionLayerBlocks) this.regionLayerConfig(0, regionLayerBlocks);
    regionLayerBlocks=this.readConfigurationBlocks(dataMap.note,'m[vz]3d-layer2-regions');
    if (regionLayerBlocks) this.regionLayerConfig(1, regionLayerBlocks);
    regionLayerBlocks=this.readConfigurationBlocks(dataMap.note,'m[vz]3d-layer3-regions');
    if (regionLayerBlocks) this.regionLayerConfig(2, regionLayerBlocks);
    regionLayerBlocks=this.readConfigurationBlocks(dataMap.note,'m[vz]3d-layer4-regions');
    if (regionLayerBlocks) this.regionLayerConfig(3, regionLayerBlocks);
};
    
mv3d.regionLayerConfig = function(l, lines){
    if(lines){
        let lowLayer = (l===0);
        const readLines = /^\s*(\d+)\s*:(.*)$/gm;
        let match;
        while(match = readLines.exec(lines)){
            if(!(match[1] in this._LAYER_REGION_DATA_MAP[l])){
                if(lowLayer && match[1] in this._REGION_DATA_MAP){
                    this._LAYER_REGION_DATA_MAP[l][match[1]]=JSON.parse(JSON.stringify(this._REGION_DATA_MAP[match[1]]));
                }else{
                    this._LAYER_REGION_DATA_MAP[l][match[1]]={};
                }
            }
            this.readConfigurationFunctions(
                match[2],
                mv3d.tilesetConfigurationFunctions,
                this._LAYER_REGION_DATA_MAP[l][match[1]],
            );
        }
    }
    for (const id in this._LAYER_REGION_DATA_MAP[l]){
        this.applyTextureConfigs(this._LAYER_REGION_DATA_MAP[l][id],'B',0,0);
        this.collapseCeilingOffsets(this._LAYER_REGION_DATA_MAP[l][id]);
    }
};