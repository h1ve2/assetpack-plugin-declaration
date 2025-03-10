import {AssetPipe, BuildReporter, PipeSystem} from "@assetpack/core";
import {readFileSync, writeFileSync} from "fs";
import path from "path";

export type buildDeclarationOption = {
    /**
     * declaration file save path
     *
     * default: "./src/assets.ts"
     */
    dist?: string,
    /**
     * type name
     *
     * default: "AssetsDeclaration"
     */
    typeName?: string,

    /**
     * assets object name
     *
     * default: assets
     */
    objectName?: string


    /**
     * create loadBundle method
     *
     * default: true
     */
    createLoadFunction?: asset,

    /**
     * 格式化工具
     *
     * 暂未实现
     *
     * 默认不使用
     */
    format?: formatTool
}

export enum formatTool {
    eslint = 'eslint',
    prettier = 'prettier'
}

export type asset = {
    /**
     * 是否注入PIXI Assets
     *
     * 自动将已加载资源添加到对象中
     */
    changePixiAssets?: boolean
}

/**
 * 创建声明文件
 * @param option
 */
export function buildDeclaration(option?: buildDeclarationOption): AssetPipe {
    let options: buildDeclarationOption = {
        dist: "./src/assets.ts",
        typeName: "AssetsDeclaration",
        objectName: "assets",
        createLoadFunction: {
            changePixiAssets: false
        },
        // format: formatTool.eslint,
        ...option
    }
    // console.log(options);

    return {
        name: 'assetpack-plugin-declaration',
        defaultOptions: {
            ...options,
        },
        tags: {
            manifest: 'm',
            mIgnore: 'mIgnore'
        },
        async finish(asset, options, pipeSystem: PipeSystem) {
            await build(pipeSystem);
        },
    }

    async function build(pipeSystem: PipeSystem) {
        BuildReporter.info("[assetpack-plugin-declaration] build...")


        const pipes = pipeSystem.pipes.filter(n => {
            return n.name === 'pixi-manifest';
        });

        if (pipes.length === 0)
            BuildReporter.error("[assetpack-plugin-declaration] pixi-manifest plugin not found!")

        const manifestPath: string = pipes[0].defaultOptions.output;

        if (!manifestPath)
            BuildReporter.error("[assetpack-plugin-declaration] pixi-manifest output path is invalid")
        // await new Promise(res=>setTimeout(res,100));

        // console.log("\n123\n")
        // console.log(asset)
        // console.log(options)
        // console.log(pipeSystem)
        const data = readFileSync(manifestPath);
        // , (err, data) => {
        //     if(err){
        //         console.error(err);
        //         return;
        //     }

        // })


        const jsonData = JSON.parse(data.toString());

        let str = `import {  Spritesheet,Texture,Assets,ArrayOr,ProgressCallback } from 'pixi.js';`

        if (options.createLoadFunction) {
            str += `
export let ${options.objectName}: AssetsDeclaration;
export function resetAssets(as) {
    ${options.objectName} = {...${options.objectName}, ...Object.assign({}, ...Object.values(as))};
    console.log(${options.objectName});
}
const func = Assets.loadBundle;`;
            str += `
export async function loadBundle (bundleIds: ArrayOr<string>, onProgress?: ProgressCallback): Promise<any> {
    const result = await func.apply(Assets, [bundleIds, onProgress]);
    resetAssets(result);
    return result;
}`;
            if (options.createLoadFunction.changePixiAssets)
                str += `
Assets.loadBundle = loadBundle`;
        }

        str += `\ntype ${options.typeName} ={`;

        for (let i: number = 0; i < jsonData.bundles.length; i++) {
            const assets: assetType[] = jsonData.bundles[i].assets;
            // console.log(assets);
            for (let j: number = 0; j < assets.length; j++) {
                const alias = assets[j].alias;
                const assetTypeStr = getType(assets[j], pipeSystem);
                // console.log(assets[j])
                for (let k: number = 0; k < alias.length; k++) {
                    alias[k] = alias[k].replaceAll(/[/\\.]/ig, "_");

                    str += "\n\"" + alias[k] + "\":" + assetTypeStr;
                }
            }
        }
        str += `    }`;


        try {
            writeFileSync(options.dist, str, "utf8");
            writeFileSync(manifestPath, JSON.stringify(jsonData), "utf8");

        } catch (e) {
            console.error(e);
        }
        // console.log(str);
    }


    function getType(asset: assetType, pipeSystem: PipeSystem): string {
        const tags = asset.data.tags;
        // console.log(tags);
        if (tags.tps) {
            return getTpsField(asset, pipeSystem);
        }
        return "any"
    }

    function getTpsField(asset: assetType, pipeSystem: PipeSystem): string {
        let data;
        let pathStr = path.join(pipeSystem.outputPath, asset.src[0])
        try {
            data = readFileSync(pathStr);
        } catch (e) {
            console.error(e);
            return "";
        }

        const jsonData = JSON.parse(data.toString());
        // console.log(jsonData);

        let str = "{textures:{";

        const keys = Object.keys(jsonData.frames)
        for (let i: number = 0; i < keys.length; i++) {
            str += "\n" + keys[i] + ":Texture"
        }
        str += "\n}}"

        // console.log(str);
        return str;
    }
}


type assetType = {
    alias: string[],
    data: {
        tags: {
            [propname: string]: boolean
        }
    },
    src: string[]

}