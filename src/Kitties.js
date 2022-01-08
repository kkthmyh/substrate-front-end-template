import React, {useEffect, useState} from 'react'
import {Form, Grid} from 'semantic-ui-react'

import {useSubstrate} from './substrate-lib'
import {TxButton} from './substrate-lib/components'

import KittyCards from './KittyCards'

export default function Kitties(props) {
    const {api, keyring} = useSubstrate()
    const {accountPair} = props

    const [kitties, setKitties] = useState([])
    const [status, setStatus] = useState('')
    const [DNAs, setDNAs] = useState([])
    const [owners, setOwners] = useState([])
    // 获取并设置所有的DNA和owners
    const fetchKitties = () => {
        let unsub = null;
        const asyncFetch = async () => {
            // 共有多少只猫咪
            unsub = await api.query.substrateKitties.kittyCnt(async cnt => {
                console.log("cnt=============" + cnt);
                if (!cnt.isNone) {
                    let kittyIds = new Array(parseInt(cnt)).fill(1).map((item, index) => {
                        return index
                    })
                    console.log("kittyIds=============" + kittyIds);
                    // 批量查询owners
                    api.query.substrateKitties.owner.multi(kittyIds, owners => {
                        setOwners(owners)
                    })
                    // 批量查询DNA
                    api.query.substrateKitties.kitties.multi(kittyIds, dnas => {
                        setDNAs(dnas)
                    })
                }
            });
        };

        asyncFetch();

        return () => {
            unsub && unsub();
        };
    }

    const populateKitties = () => {
        const kitties = []
        for (let i = 0; i < DNAs.length; ++i) {
            const kitty = {}
            kitty.id = i
            kitty.dna = DNAs[i].unwrap()
            kitty.owner = keyring.encodeAddress(owners[i].unwrap())
            kitties[i] = kitty
        }
        setKitties(kitties)
    }

    useEffect(fetchKitties, [api, keyring])
    useEffect(populateKitties, [keyring, DNAs, owners])

    return <Grid.Column width={16}>
        <h1>Kitty</h1>
        <KittyCards kitties={kitties} accountPair={accountPair} setStatus={setStatus}/>
        <Form style={{margin: '1em 0'}}>
            <Form.Field style={{textAlign: 'center'}}>
                <TxButton
                    accountPair={accountPair} label='创建Kitty' type='SIGNED-TX' setStatus={setStatus}
                    attrs={{
                        palletRpc: 'substrateKitties',
                        callable: 'create',
                        inputParams: [],
                        paramFields: []
                    }}
                />
            </Form.Field>
        </Form>
        <div style={{overflowWrap: 'break-word'}}>{status}</div>
    </Grid.Column>
}
