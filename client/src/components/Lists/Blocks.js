/**
 *    SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import Button from 'reactstrap/lib/Button';
import Input from 'reactstrap/lib/Input';
import InputGroup from 'reactstrap/lib/InputGroup';
import InputGroupAddon from 'reactstrap/lib/InputGroupAddon';
import FontAwesome from 'react-fontawesome';
import find from 'lodash/find';
import { isNull } from 'util';
import ReactTable from '../Styled/Table';
import BlockView from '../View/BlockView';
import TransactionView from '../View/TransactionView';
import DatePicker from '../Styled/DatePicker';
import {
  blockListType,
} from '../types';

import compose from 'recompose/compose';
import { gql } from 'apollo-boost';
import { graphql } from 'react-apollo';

const styles = (theme) => {
  const { type } = theme.palette;
  const dark = type === 'dark';
  return {
    hash: {
      '&, & li, & ul': {
        overflow: 'visible !important',
      },
    },
    partialHash: {
      textAlign: 'center',
      position: 'relative !important',
      '&:hover $fullHash': {
        display: 'block',
        position: 'absolute !important',
        padding: '4px 4px',
        backgroundColor: dark ? '#5e558e' : '#000000',
        marginTop: -30,
        marginLeft: -215,
        borderRadius: 8,
        color: '#ffffff',
        opacity: dark ? 1 : undefined,
      },
      '&:hover $lastFullHash': {
        display: 'block',
        position: 'absolute !important',
        padding: '4px 4px',
        backgroundColor: dark ? '#5e558e' : '#000000',
        marginTop: -30,
        marginLeft: -415,
        borderRadius: 8,
        color: '#ffffff',
        opacity: dark ? 1 : undefined,
      },
    },
    fullHash: {
      display: 'none',
    },
    lastFullHash: {
      display: 'none',
    },
    filter: {
      width: '100%',
      textAlign: 'center',
      margin: '0px !important',
    },
    filterButton: {
      opacity: 0.8,
      margin: 'auto',
      width: '100% !important',
      'margin-bottom': '4px',
    },
    searchButton: {
      opacity: 0.8,
      margin: 'auto',
      width: '100% !important',
      backgroundColor: dark ? undefined : '#086108',
      'margin-bottom': '4px',
    },
    filterElement: {
      textAlign: 'center',
      display: 'flex',
      padding: '0px !important',
      '& > div': {
        width: '100% !important',
        marginTop: 20,
      },
      '& .label': {
        margin: '25px 10px 0px 10px',
      },
    },
  };
};

export class Blocks extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dialogOpen: false,
      dialogOpenBlockHash: false,
      to: null,
      from: null,
      blockHash: {},
      searchBlockHeight: null,
      page: 0,
    };
    this.searchBlockHeightRef = null;
  }

  timeError() {
    const { from, to } = this.state;
    return from !== null && to !== null && from > to;
  }

  handleDialogOpen = async (tid) => {
    this.setState({ dialogOpen: true, transaction: tid });
  };

  handleDialogClose = () => {
    this.setState({ dialogOpen: false });
  };

  handleSearch = async () => {
    const { from, to } = this.state;
    this.props.refetch({
      timeAfter: from === null ? null : from.toISOString(),
      timeBefore: to === null ? null : to.toISOString()
    });
  };

  handleClearSearch = () => {
    this.setState(
      { to: null, from: null },
      this.handleSearch,
    );
  };

  handleDialogOpenBlockHash = (blockHash) => {
    const { blockList } = this.props;
    const data = find(blockList, item => item.blockhash === blockHash);

    this.setState({
      dialogOpenBlockHash: true,
      blockHash: data,
    });
  };

  openBlockByHeight(height) {
    this.setState({
      dialogOpenBlockHash: true,
      blockHash: { height },
    });
  }

  handleDialogCloseBlockHash = () => {
    this.setState({ dialogOpenBlockHash: false });
  };

  searchBlockHeightOnChange(value) {
    const { totalBlockCount } = this.props;
    this.setState({ searchBlockHeight: isNaN(value) ? null : Math.max(1, totalBlockCount !== null && value > totalBlockCount ? totalBlockCount : value) | 0 });
    if (isNaN(value) && this.searchBlockHeightRef) {
      this.searchBlockHeightRef.setAttribute('value', '');
    }
  }

  onPageSizeChange = (pageSize, page) => {
    this.onPageChange(page, pageSize);
  };

  onPageChange = async (page, pageSize) => {
    pageSize = pageSize || this.props.pageSize;
    await this.props.refetch({ after: page * pageSize, pageSize });
    this.setState({ page });
  };

  reactTableSetup = classes => [
    {
      Header: 'Height',
      accessor: 'blocknum',
      width: 80,
    },
    {
      Header: 'Hash',
      accessor: 'blockhash',
      className: classes.hash,
      Cell: row => (
        <span>
          <a
            data-command="block-partial-hash"
            className={classes.partialHash}
            onClick={() => this.handleDialogOpenBlockHash(row.value)}
            href="#/blocks"
          >
            <div className={classes.fullHash} id="showTransactionId">
              {row.value}
            </div>
            {' '}
            {row.value.slice(0, 6)}
            {' '}
            {!row.value ? '' : '... '}
          </a>
          {' '}
        </span>
      ),
    },
    {
      Header: 'Transactions',
      accessor: 'txhash',
      className: classes.hash,
      Cell: row => (
        <ul>
          {!isNull(row.value)
            ? row.value.map(tid => (
              <li
                key={tid}
                style={{
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                }}
              >
                <a
                  className={classes.partialHash}
                  onClick={() => this.handleDialogOpen(tid)}
                  href="#/blocks"
                >
                  <div
                    className={classes.lastFullHash}
                    id="showTransactionId"
                  >
                    {tid}
                  </div>
                  {' '}
                  {tid.slice(0, 6)}
                  {' '}
                  {!tid ? '' : '... '}
                </a>
              </li>
            ))
            : 'null'}
        </ul>
      ),
    },
  ];

  render() {
    const {
      blockList, classes, totalBlockCount,
      pageSize, loading,
    } = this.props;
    const {
      transaction, blockHash, dialogOpen, dialogOpenBlockHash, searchBlockHeight,
      page,
    } = this.state;
    return (
      <div>
        <div className={`${classes.filter} row searchRow`}>
          <div className="col-md-2">
            <InputGroup>
              <Input
                type="number"
                placeholder="Height"
                value={searchBlockHeight === null ? '' : searchBlockHeight}
                onChange={e => this.searchBlockHeightOnChange(e.target.valueAsNumber)}
                innerRef={e => this.searchBlockHeightRef = e}
              />
              {totalBlockCount !== null && searchBlockHeight !== null && <InputGroupAddon addonType="append">
                <Button
                  className={classes.searchButton}
                  color="success"
                  onClick={() => this.openBlockByHeight(searchBlockHeight)}
                >
                  <FontAwesome name="external-link" />
                </Button>
              </InputGroupAddon>}
            </InputGroup>
          </div>
          <div className={`${classes.filterElement} col-md-3`}>
            <label className="label">
From
            </label>
            <DatePicker
              id="from"
              selected={this.state.from}
              showTimeSelect
              timeIntervals={5}
              dateFormat="LLL"
              onChange={from => this.setState({ from })}
            />
          </div>
          <div className={`${classes.filterElement} col-md-3`}>
            <label className="label">
To
            </label>
            <DatePicker
              id="to"
              selected={this.state.to}
              showTimeSelect
              timeIntervals={5}
              dateFormat="LLL"
              onChange={to => this.setState({ to })}
            >
              <div className="validator ">
                {this.timeError() && (
                  <span className=" label border-red">
                    {' '}
                    From date should be less than To date
                  </span>
                )}
              </div>
            </DatePicker>
          </div>
          <div className="col-md-2">
            <Button
              className={classes.searchButton}
              color="success"
              disabled={this.timeError()}
              onClick={async () => {
                await this.handleSearch();
              }}
            >
              Search
            </Button>
          </div>
          <div className="col-md-1">
            <Button
              className={classes.filterButton}
              color="primary"
              onClick={() => {
                this.handleClearSearch();
              }}
            >
              Reset
            </Button>
          </div>
        </div>
        <ReactTable
          data={blockList}
          columns={this.reactTableSetup(classes)}
          list
          sortable={false}
          minRows={0}
          style={{ height: '750px' }}

          manual
          loading={loading}
          page={page}
          pageSize={pageSize}
          onPageChange={this.onPageChange}
          onPageSizeChange={this.onPageSizeChange}
          pages={totalBlockCount !== null ? Math.ceil(totalBlockCount / pageSize) : 1}
        />

        <Dialog
          open={dialogOpen}
          onClose={this.handleDialogClose}
          fullWidth
          maxWidth="md"
        >
          <TransactionView
            transaction={transaction}
            onClose={this.handleDialogClose}
          />
        </Dialog>

        <Dialog
          open={dialogOpenBlockHash}
          onClose={this.handleDialogCloseBlockHash}
          fullWidth
          maxWidth="md"
        >
          <BlockView
            blockHash={blockHash}
            onClose={this.handleDialogCloseBlockHash}
          />
        </Dialog>
      </div>
    );
  }
}

Blocks.propTypes = {
  blockList: blockListType.isRequired,
};

export default compose(
  withStyles(styles),
	graphql(
		gql`query ($pageSize: Int!, $after: Int, $timeAfter: String, $timeBefore: String) {
			list: blockList(count: $pageSize, after: $after, timeAfter: $timeAfter, timeBefore: $timeBefore) {
        items {
          height
          hash
          previousBlockHash
          transactionCount
          transactions {
            hash
          }
        }
			}
      total: blockCount
    }`,
    {
      options: {
        variables: {
          pageSize: 10,
        },
      },
      props({ data: { list, total, loading, refetch, variables: { pageSize } } }) {
        return {
          blockList: list ? list.items.map(({ height, hash, previousBlockHash, transactionCount, transactions }) => ({
            height,
            blocknum: height,
            txcount: transactionCount,
            blockhash: hash,
            prehash: previousBlockHash,
            txhash: transactions.map(x => x.hash),
          })) : [],
          totalBlockCount: total === undefined ? null : total,
          pageSize,
          loading,
          refetch,
        };
      },
    },
	),
)(Blocks);
