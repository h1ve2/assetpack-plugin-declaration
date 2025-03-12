# assetpack-plugin-declaration

使用assetpack时自动构建声明文件

> 使用后会自动将manifest内资源的alias中的[/\\.]替换为下划线"_"，以便IDE提供提示功能

## 使用方法
### 1. .assetpack.js

```
import  {buildDeclaration} from "assetpack-plugin-declaration"
...

export default {
  ...
  pipes: [
    ...
    pixiManifest({
        output: './src/manifest.json',
    }),
    buildDeclaration() // 添加至结尾
  ]
};
...
```

### 2. 使用assets
```
import {assets, loadBundle} from "./assets"; // assets文件由此插件生成
...
await loadBundle('loading');
const pic = Sprite.from(assets.loading_pic);

app.stage.addChild(pic);
```

## 选项
```
{

    dist?:string, // 声明文件保存路径, 默认: "./src/assets.ts"
    
    objectName?: string, // assets对象名称, 默认: "assets"
    
    createLoadFunction?: { // 创建loadBundle方法, 默认: true
    
        /**
         *  是否自动注入到PIXI.Assets, 默认: false
         *  为true则可以直接使用PIXI内置的Assets.loadBundle()
         */
        changePixiAssets?: boolean 
        
    }

}
```