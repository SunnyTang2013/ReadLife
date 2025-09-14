import React from 'react';

class ReleaseStatics extends React.Component {
  static getDefaultQuery() {
    return {
      jobNameKeyword: '',
      sort: 'name,asc',
      page: 0,
      size: 5000,
    };
  }

  static rowName(item) {
    if (item.type === ReleaseStatics.JOB) {
      if (item.action === ReleaseStatics.ACTION_CREATE_OR_UPDATE) {
        const covered = item.targetContextName ? '(will not covered)' : '';
        const contextName = item.targetContextName ? item.targetContextName : item.jobContextName;
        return `(Target Hierarchy) ${item.targetGroupNames.join(',')} -> (Job Name) ${item.name} : (Context) ${contextName} ${covered}`;
      }
      if (item.action === ReleaseStatics.ACTION_UPDATE_JOB_INFO) {
        const covered = item.targetContextName ? '(will not covered)' : '';
        return `(Target Hierarchy) ${item.targetGroupNames.join(',')} -> (Job Name) ${item.name} : (Context) ${item.jobContextName} ${covered}`;
      }
      if (item.action === ReleaseStatics.ACTION_MOVE) {
        return `(Move Out) ${item.sourceGroupNames.join(',')} -> (Move In) ${item.targetGroupNames.join(',')} -> (Job Name)${item.name}`;
      }
      if (item.action === ReleaseStatics.ACTION_DELETE) {
        return `${item.targetGroupNames.join(',')}->${item.name}`;
      }
    } else if (item.type === ReleaseStatics.JOB_GROUP) {
      let rowName = `_Trash -> ${item.name}`;
      if (item.action !== ReleaseStatics.ACTION_DELETE) {
        rowName = `(Parent) ${item.targetGroupNames ? item.targetGroupNames.join(',') : 'Root'} -> (Child) ${item.name}`;
      }
      return rowName;
    } else if (item.type === ReleaseStatics.CONTEXT) {
      return item.name;
    } else if (item.type === ReleaseStatics.CONFIG_GROUP) {
      return `(Category)${item.category} -> (Name) ${item.name}`;
    } else if (item.type === ReleaseStatics.BATCH) {
      return `(Batch)${item.name}`;
    }
    return null;
  }
}

ReleaseStatics.TYPE_ADD_JOB_GROUP = 'ADD_JOB_GROUP';
ReleaseStatics.TYPE_ADD_JOB = 'ADD_JOB';
ReleaseStatics.TYPE_FOLDER = 'FOLDER';
ReleaseStatics.TYPE_CONTEXT = 'CONTEXT';
ReleaseStatics.TYPE_BATCH = 'BATCH';
ReleaseStatics.TYPE_CONFIGURATION = 'CONFIGURATION';

ReleaseStatics.ACTION_CREATE_OR_UPDATE = 'CREATE_OR_UPDATE';
ReleaseStatics.ACTION_UPDATE_JOB_INFO = 'UPDATE_JOB_INFO';
ReleaseStatics.ACTION_MOVE = 'MOVE';
ReleaseStatics.ACTION_DELETE = 'DELETE';

ReleaseStatics.JOB_ADD_BATCH = 'ADD_BATCH';
ReleaseStatics.JOB_ADD_SINGLE = 'ADD_SINGLE';

ReleaseStatics.JOB = 'JOB';
ReleaseStatics.JOB_GROUP = 'JOB_GROUP';
ReleaseStatics.CONTEXT = 'CONTEXT';
ReleaseStatics.BATCH = 'BATCH';
ReleaseStatics.CONFIG_GROUP = 'CONFIG_GROUP';

ReleaseStatics.ENV_PROD = 'Prod';
ReleaseStatics.ENV_PREPROD = 'PreProd';
ReleaseStatics.ENV_PREPROD_BLACK = 'PreProdBlack';
ReleaseStatics.ENV_QTF = 'QTF';
ReleaseStatics.ENV_UAT = 'Uat';

ReleaseStatics.JobGroupList = null;
ReleaseStatics.JobContextList = null;

export default ReleaseStatics;