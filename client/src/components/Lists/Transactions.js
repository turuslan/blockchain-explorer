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
      page: 0,
    };
  }

  handleDialogOpen = async (tid) => {
    this.setState({ dialogOpen: true, transaction: tid });
  };

  handleDialogClose = () => {
    this.setState({ dialogOpen: false });
  };

  onPageSizeChange = (pageSize, page) => {
    this.onPageChange(page, pageSize);
  };

  onPageChange = async (page, pageSize) => {
    pageSize = pageSize || this.props.pageSize;
    await this.props.refetch({ after: page * pageSize, pageSize });
    this.setState({ page });
  };

  timeRangeOnChange = key => (value) => {
    this.setState({ page: 0 });
    this.props.refetch({ after: null, [key]: value });
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
      timeAfter, timeBefore,
    } = this.props;
    const {
      transaction, dialogOpen,
      page,
    } = this.state;
    return (
      <div>
        <div className={`${classes.filter} row searchRow`}>
          <div className="col-md-3">
            <DatePicker
              placeholderText="From"
              selected={timeAfter}
              showTimeSelect
              timeIntervals={5}
              dateFormat="LLL"
              onChange={this.timeRangeOnChange('timeAfter')}
              maxDate={timeBefore}
            />
          </div>
          <div className="col-md-3">
            <DatePicker
              placeholderText="To"
              selected={timeBefore}
              showTimeSelect
              timeIntervals={5}
              dateFormat="LLL"
              onChange={this.timeRangeOnChange('timeBefore')}
              minDate={timeAfter}
            />
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
          timeAfter: null,
          timeBefore: null,
        },
      },
      props({ data: { list, total, loading, refetch, variables: { pageSize, timeAfter, timeBefore } } }) {
        return {
          transactionList: list ? list.items.map(({ hash, time, createdBy }) => ({
            txhash: hash,
            createdt: time,
            creator_msp_id: createdBy.id,
          })) : [],
          totalTransactionCount: total === undefined ? null : total,
          pageSize,
          timeAfter,
          timeBefore,
          loading,
          refetch,
        };
      },
    },
	),
)(Transactions);
