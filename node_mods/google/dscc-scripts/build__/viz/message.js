"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @license
 * Copyright 2018 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const bluebird = require("bluebird");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const path = require("path");
const webpack = require("webpack");
const args_1 = require("../args");
const util_1 = require("../util");
const util = require("./util");
const buildOptions = (buildValues, args) => {
    buildValues.jsonFile = buildValues.components[0].jsonFile; 
    buildValues.cssFile = buildValues.components[0].cssFile;
    buildValues.jsFile = buildValues.components[0].jsFile;
    buildValues.tsFile = buildValues.components[0].tsFile; 
    let transformString;
    const format = args.format;
    switch (format) {
        case args_1.MessageFormat.OBJECT:
            transformString = 'objectTransform';
            break;
        case args_1.MessageFormat.TABLE:
            transformString = 'tableTransform';
            break;
        default:
            return util_1.assertNever(format);
    }
    const plugins = [
        // Add config
        new CopyWebpackPlugin([
            { from: path.join(buildValues.pwd, 'src', buildValues.jsonFile), to: '.' },
        ]),
        // Add manifest
        new CopyWebpackPlugin([
            {
                from: path.join('src', buildValues.manifestFile),
                to: '.',
                transform: (content) => {
                    const manifestContents = content.toString();
                    const newManifest = manifestContents
                        .replace(/YOUR_GCS_BUCKET/g, buildValues.gcsBucket)
                        .replace(/"DEVMODE_BOOL"/, `${buildValues.devMode}`);
                    return newManifest;
                },
            },
        ]),
        // Add transform param definition
        new webpack.DefinePlugin({
            TRANSFORM_PARAM: `"${transformString}"`,
        }),
    ];
    // Only add in the copy plugin for the css if the user provides a css value in
    // the manifest.
    if (buildValues.cssFile !== undefined) {
        plugins.push(new CopyWebpackPlugin([
            { from: path.join('src', buildValues.cssFile), to: '.' },
        ]));
    }
    return {
        mode: 'development',
        entry: {
            // this is the viz source code
            main: path.resolve(__dirname, '../../', 'viz', 'printMessage.js'),
        },
        output: {
            filename: 'index.js',
            path: path.resolve(buildValues.pwd, 'build'),
        },
        plugins,
    };
};
exports.buildMessage = async (args) => {
    const buildValues = util.validateBuildValues(args);
    const webpackOptions = buildOptions(buildValues, args);
    const compiler = webpack(webpackOptions);
    const compilerRun = bluebird.promisify(compiler.run, { context: compiler });
    await compilerRun();
};
