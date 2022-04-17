/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

// Deterministic JSON.stringify()
const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class AssetTransfer extends Contract {

    async InitLedger(ctx) {
        const assets = [
            {
                documentNo : '671',
                documentSize : '1268 KB',
                owner : 'User1',
                documentLink : 'https://www.google.com',
            },
            {
                documentNo : '672',
                documentSize : '512 KB',
                owner : 'User2',
                documentLink : 'https://www.facebook.com',
            },
        ];

        for (const asset of assets) {
            asset.docType = 'asset';
            // example of how to write to world state deterministically
            // use convetion of alphabetic order
            // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
            // when retrieving data, in any lang, the order of data will be the same and consequently also the corresonding hash
            await ctx.stub.putState(asset.documentNo, Buffer.from(stringify(sortKeysRecursive(asset))));
        }
    }

    // CreateAsset issues a new asset to the world state with given details.
    async CreateAsset(ctx, documentNo,documentName, documentType, documentSize, documentLink){

        const exists = await this.AssetExists(ctx, documentNo);
        if (exists) {
            throw new Error(`The asset ${documentNo} already exists`);
        }

        const userName = await this.GetID(ctx);

        const asset = {
            documentNo: documentNo,
            documentName: documentName,
            documentType: documentType,
            documentSize: documentSize,
            documentLink: documentLink,
            lastModification: (new Date(Date.now())).toUTCString(),
            ownedBy: userName,
        };
        //we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(documentNo, Buffer.from(stringify(sortKeysRecursive(asset))));
        return JSON.stringify(asset);
    }

    // ReadAsset returns the asset stored in the world state with given documentNo.
    async ReadAsset(ctx, documentNo) {
        const assetJSON = await ctx.stub.getState(documentNo); // get the asset from chaincode state
        if (!assetJSON || assetJSON.length === 0) {
            throw new Error(`The asset ${documentNo} does not exist`);
        }
        return assetJSON.toString();
    }


    async GetID(ctx) {
        const arr1 = ctx.clientIdentity.getID().split('::');
        const arr2 = arr1[1].split('/');
        const arr3 = arr2[4].split('=');
        return arr3[1];
    }

    // UpdateAsset updates an existing asset in the world state with provided parameters.
    async UpdateAsset(ctx, documentNo,documentName, documentType, documentSize, documentLink) {

        const exists = await this.AssetExists(ctx, documentNo);
        if (!exists) {
            throw new Error(`The asset ${documentNo} does not exist`);
        }

        // overwriting original asset with new asset
        const updatedAsset = {
            documentNo: documentNo,
            documentName: documentName,
            documentType: documentType,
            documentSize: documentSize,
            documentLink: documentLink,
            lastModification: (new Date(Date.now())).toUTCString(),
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        return ctx.stub.putState(documentNo, Buffer.from(stringify(sortKeysRecursive(updatedAsset))));
    }

    // DeleteAsset deletes an given asset from the world state.
    async DeleteAsset(ctx, documentNo) {
        
        const exists = await this.AssetExists(ctx, documentNo);
        if (!exists) {
            throw new Error(`The asset ${documentNo} does not exist`);
        }

        return ctx.stub.deleteState(documentNo);
    }

    // AssetExists returns true when asset with given ID exists in world state.
    async AssetExists(ctx, documentNo) {
        const assetJSON = await ctx.stub.getState(documentNo);
        return assetJSON && assetJSON.length > 0;
    }

    // TransferAsset updates the owner field of asset with given documentNo in the world state.
    async TransferAsset(ctx, documentNo, newOwner) {
        const assetString = await this.ReadAsset(ctx, documentNo);
        const asset = JSON.parse(assetString);

        asset.lastModification = (new Date(Date.now())).toUTCString();
        asset.ownedBy = newOwner;

        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        const assetJSON = await ctx.stub.putState(documentNo, Buffer.from(stringify(sortKeysRecursive(asset))));
        
        return assetJSON.toString();
    }

    // GetAllAssets returns all assets found in the world state.
    async GetAllAssets(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }
}

module.exports = AssetTransfer;
