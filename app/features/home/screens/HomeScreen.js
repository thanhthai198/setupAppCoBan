import React, { Component } from 'react';
import { View, FlatList, Image, RefreshControl, ActivityIndicator } from 'react-native';
import { Text, Card, Button, CardItem, Left, Right } from 'native-base';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import styles from './HomeScreenStyles';
import i18n from '../../../utils/i18n';
import * as StringNames from '../../../assets/locales/StringNames';
import HomeSelectors from '../selectors';
import * as HomeActions from '../actions';
import { BaseResponse, ArticleObj } from '../../../types/ResponseTypes';
import { Drawables } from '../../../assets/images';
import { getIntegerResources, getStringResources } from '../../../config';
import SafeAreaView from 'react-native-safe-area-view';
import * as NavigationHelpers from '../../../navigation/NavigationHelpers';
import env from '../../../config/environment';

const TAG = 'HomeScreen';

const integerResources = getIntegerResources();
const stringResources = getStringResources();
type Props = {
  status: BaseResponse,
  onTopHeadlines: PropTypes.func,
};

class HomeScreen extends Component<Props> {
  componentDidMount() {
    console.log(TAG + ' componentDidMount ');
    const status = this.props.status;
    this.getTopHeadlines(status.page === null ? 1 : status.page, false, null);
  }

  getTopHeadlines(page: number, isRefreshing: boolean, initialData: ?BaseResponse) {
    console.log(TAG + ' getTopHeadlines page= ' + page + ' isRefreshing= ' + isRefreshing);
    const status = this.props.status;

    let isRequestMore = true;
    if (status.articles && status.totalResults && status.articles.length >= status.totalResults) {
      isRequestMore = false;
    }

    if (
      page !== null &&
      typeof page === 'number' &&
      !isNaN(page) &&
      (isRequestMore || isRefreshing)
    )
      this.props.onTopHeadlines(
        stringResources.default_country,
        page,
        integerResources.default_page_size,
        isRefreshing,
        initialData
      );
  }

  onKeyExtractor(item: any, index: number) {
    return index.toString();
  }

  onItemFlatListClick(item: ArticleObj, index: number) {
    console.log(TAG + ' onItemFlatListClick() index= ' + index);
    NavigationHelpers.navigateToDetailHeadlines({ data: item.url });
  }

  onReloadData() {
    const status = this.props.status;
    console.log(TAG + ' onReloadData ');
    const isRefreshing = status.status !== 'error' && status.status !== 'none';
    this.getTopHeadlines(1, isRefreshing, status);
  }

  handleLoadMore() {
    const status = this.props.status;
    console.log(
      TAG +
        ' handleLoadMore() status.loading= ' +
        status.loading +
        ' status.status= ' +
        status.status +
        ' status.page= ' +
        status.page
    );
    if (!status.loading && status.status === 'ok') {
      const page = status.page + 1;
      this.getTopHeadlines(page, false, status);
    }
  }

  renderFooterFlatList() {
    const status = this.props.status;
    if (status.loading === false) return <View style={{ height: 20 }} />;
    else return <ActivityIndicator />;
  }

  renderItemList(item: ArticleObj, index: number) {
    // console.log(TAG + ' renderItemList item= ' + JSON.stringify(item) + '  \n\n index= ' + index);
    const imgUrl =
      item.urlToImage === null ? Drawables.no_image_available : { uri: item.urlToImage };

    return (
      <Card>
        <CardItem button onPress={() => this.onItemFlatListClick(item, index)}>
          <Left>
            <Image source={imgUrl} style={{ width: 150, height: 112 }} />
          </Left>
          <Right>
            <CardItem cardBody style={{}}>
              <Text numberOfLines={4} style={{ fontSize: 15 }}>
                {item.title}
              </Text>
            </CardItem>
            <CardItem cardBody style={{ alignSelf: 'flex-start' }}>
              <Text numberOfLines={2} style={{ fontSize: 12, fontStyle: 'italic' }}>
                From:{' '}
                {item.source != null && item.source.name != null ? item.source.name : 'unknown'}
              </Text>
            </CardItem>
          </Right>
        </CardItem>
      </Card>
    );
  }

  render() {
    const status = this.props.status;

    if (status.loading === true && status.page === 1) {
      return (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator style={{}} />
        </View>
      );
    } else if (
      status.status === 'error' &&
      status.page === 1 &&
      (!status.articles || status.articles.length === 0)
    ) {
      return (
        <SafeAreaView
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
          }}
        >
          <Text style={{ padding: 10 }}>{i18n.t(StringNames.NoConnection)}</Text>
          <Button center onPress={() => this.onReloadData()}>
            <Text>Retry</Text>
          </Button>
        </SafeAreaView>
      );
    } else if (status.articles && status.articles.length === 0) {
      return (
        <SafeAreaView
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'column',
          }}
        >
          <Text>{i18n.t(StringNames.NoData)}</Text>
        </SafeAreaView>
      );
    } else {
      return (
        <SafeAreaView style={styles.container}>
          <Text>Env: {env.NAME}</Text>
          <FlatList
            style={{ paddingLeft: 10, paddingRight: 10 }}
            data={status.articles}
            refreshControl={
              <RefreshControl
                refreshing={status.isRefreshing}
                onRefresh={() => this.onReloadData()}
              />
            }
            renderItem={({ item, index }) => this.renderItemList(item, index)}
            ListFooterComponent={() => this.renderFooterFlatList()}
            onEndReachedThreshold={0.5}
            keyExtractor={(item, index) => this.onKeyExtractor(item, index)}
            onEndReached={() => this.handleLoadMore()}
          />
        </SafeAreaView>
      );
    }
  }
}

function mapStateToProps(state) {
  console.log(TAG + ' mapStateToProps ' + JSON.stringify(state));
  return {
    status: HomeSelectors.getHomeState(state),
  };
}

function mapDispatchToProps(dispatch) {
  console.log(TAG + ' mapDispatchToProps ');
  return {
    onTopHeadlines: (
      country: string,
      page: number,
      pageSize: number,
      isRefreshing: boolean,
      initialData: ?BaseResponse
    ) =>
      dispatch(HomeActions.requestTopHeadlines(country, page, pageSize, isRefreshing, initialData)),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(HomeScreen);
