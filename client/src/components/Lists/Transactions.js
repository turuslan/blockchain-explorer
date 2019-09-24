/**
 *    SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import Button from 'reactstrap/lib/Button';
import ReactTable from '../Styled/Table';
import TransactionView from '../View/TransactionView';
import DatePicker from '../Styled/DatePicker';

import compose from 'recompose/compose';
import { gql } from 'apollo-boost';
import { graphql } from 'react-apollo';

const styles = (theme) => {
  const { type } = theme.palette;
  const dark = type === 'dark';
  return {
    hash: {
      '&, & li': {
        overflow: 'visible !important',
      },
    },
    partialHash: {
      textAlign: 'center',
      position: 'relative !important',
      '&:hover $lastFullHash': {
        marginLeft: -400,
      },
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
    },
    fullHash: {
      display: 'none',
    },
    lastFullHash: {},
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

export class Transactions extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dialogOpen: false,
      to: null,
      from: null,
      page: 0,
    };
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

  onPageSizeChange = (pageSize, page) => {
    this.onPageChange(page, pageSize);
  };

  onPageChange = async (page, pageSize) => {
    pageSize = pageSize || this.props.pageSize;
    await this.props.refetch({ after: page * pageSize, pageSize });
    this.setState({ page });
  };

  render() {
    const { classes } = this.props;
    const columnHeaders = [
      {
        Header: 'Creator',
        accessor: 'creator_msp_id',
      },
      {
        Header: 'Hash',
        accessor: 'txhash',
        className: classes.hash,
        Cell: row => (
          <span>
            <a
              data-command="transaction-partial-hash"
              className={classes.partialHash}
              onClick={() => this.handleDialogOpen(row.value)}
              href="#/transactions"
            >
              <div className={classes.fullHash} id="showTransactionId">
                {row.value}
              </div>
              {' '}
              {row.value.slice(0, 6)}
              {!row.value ? '' : '... '}
            </a>
          </span>
        ),
      },
      {
        Header: 'Timestamp',
        accessor: 'createdt',
      },
    ];

    const {
      transactionList,
      totalTransactionCount, pageSize, loading,
    } = this.props;
    const {
      transaction, dialogOpen,
      page,
    } = this.state;
    return (
      <div>
        <div className={`${classes.filter} row searchRow`}>
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
          data={transactionList}
          columns={columnHeaders}
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
          pages={totalTransactionCount !== null ? Math.ceil(totalTransactionCount / pageSize) : 1}
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
      </div>
    );
  }
}

export default compose(
  withStyles(styles),
	graphql(
		gql`query ($pageSize: Int!, $after: Int, $timeAfter: String, $timeBefore: String) {
			list: transactionList(count: $pageSize, after: $after, timeAfter: $timeAfter, timeBefore: $timeBefore) {
        items {
          hash
          time
          createdBy {
            id
          }
        }
			}
      total: transactionCount
    }`,
    {
      options: {
        variables: {
          pageSize: 10,
        },
      },
      props({ data: { list, total, loading, refetch, variables: { pageSize } } }) {
        return {
          transactionList: list ? list.items.map(({ hash, time, createdBy }) => ({
            txhash: hash,
            createdt: time,
            creator_msp_id: createdBy.id,
          })) : [],
          totalTransactionCount: total === undefined ? null : total,
          pageSize,
          loading,
          refetch,
        };
      },
    },
	),
)(Transactions);
