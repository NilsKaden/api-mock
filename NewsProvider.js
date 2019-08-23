import React, { Component } from 'react';
import {
    string,
    number,
    node,
} from 'prop-types';
import NewsItem from '../NewsItem/NewsItem';

export default class NewsProvider extends Component {
    constructor(props) {
        super(props);
        this.fetchAndBuildJSON = this.fetchAndBuildJSON.bind(this);
        this.generateNewsJSX = this.generateNewsJSX.bind(this);
        this.handleLoadMoreClick = this.handleLoadMoreClick.bind(this);
        this.insertDividerIntoNewsJSX = this.insertDividerIntoNewsJSX.bind(this);

        this.state = {
            data: null,
            loadMoreNewsCounter: 1,
        };
    }

    componentDidMount() {
        const { refreshRateInSeconds } = this.props;

        console.log('did mount');
        this.poll();

        // queryUrl is first url to be polled

        setInterval(() => { console.log('polling now!'); this.poll()}, refreshRateInSeconds * 1000); 
    }

    // takes json and url as argument. Fetches URL, loads the json and appends it to the supplied json (or empty default)
    // to be called recursively on itself to buildup the json
    fetchAndBuildJSON = (url, repeatNTimes, json = []) => {

        console.log('fetch and build', url, repeatNTimes, json);
        if (repeatNTimes === 0) {
            return json;
        }

        return (
            fetch(url)
                .then(res => res.json())
                .then(newJson => {
                    const mergedJson = [...Object.values(json), ...Object.values(newJson)];
                    const nextUrl = mergedJson[mergedJson.length - 1].next_page;
            
                    // extra exit condition if there is no more url we can follow
                    if (nextUrl === "") {
                        return mergedJson;
                    }
            
                    return (this.fetchAndBuildJSON(nextUrl, repeatNTimes - 1, mergedJson));
                })
        );
    }

    handleLoadMoreClick() {
        const { loadMoreNewsCounter } = this.state;

        this.setState({
            loadMoreNewsCounter: loadMoreNewsCounter + 1,
        }, () => this.poll());
    }

    // tested and works
    insertDividerIntoNewsJSX(newsJSX) {
        const { dividerHTML, dividerPosition } = this.props;
        const htmlDivider = <div key="news__divider" dangerouslySetInnerHTML={{ __html: dividerHTML }} />
        const insertedJSX = Object.values(newsJSX);
        insertedJSX.splice(dividerPosition - 1, 0, htmlDivider);

        return insertedJSX;
    }

    // tested and works
    generateNewsJSX() {
        const { data } = this.state;
        console.log('generate JSX', typeof(data), data);


        const newsHTML = data && data.map(newsItem => {
            const date = new Date(newsItem.date);
            const parsedDate = `${date.getDate()}.${date.getMonth()}.${date.getFullYear()}`

            return (
                <NewsItem
                    key={newsItem.id}
                    imagesrc={newsItem.teaser_picture}
                    imagealt={newsItem.teaser_picture_alt}
                    date={parsedDate}
                    headline={newsItem.headline}
                    category={newsItem.taxonomies && newsItem.taxonomies[0]}
                    text={newsItem.teaser_text}
                    href={newsItem.href || '#'}
                />
            );
        });

        return newsHTML;
    }

    poll() {
        const { data, loadMoreNewsCounter } = this.state;
        const { queryurl } = this.props;

        console.log('poll: ', data, loadMoreNewsCounter, queryurl);

        // initial poll
        if (data === null) {
            this.setState({
                data: this.fetchAndBuildJSON(queryurl, loadMoreNewsCounter),
            });
        }

        // check if the news has changed, if so, refetch everything
        fetch(queryurl)
            .then(res => res.json())
            .then(reFetchedJson => {
                console.log(data, reFetchedJson);
                // if something has changed, refetch all
                if (!data || reFetchedJson[0].id !== data[0].id) {
                    this.setState({
                        data: this.fetchAndBuildJSON(queryurl, loadMoreNewsCounter),
                    });
                }
            });
    }

    render() {
        const { className } = this.props;
        const { data } = this.state;

        console.log('render: ', data);


        return (
            <div className={className}>
                {data && this.insertDividerIntoNewsJSX(this.generateNewsJSX())}
                <button
                    type="button"
                    className={`newsitem__button ${ data && data[data.length - 1].next_page === "" ? 'newsitem__button--hidden' : ''}`}
                    onClick={this.handleLoadMoreClick}
                >
                    Mehr laden
                </button>
            </div>
        );
    }
    
}

NewsProvider.propTypes = {
    className: string,
    dividerPosition: number,
    queryurl: string,
    refreshRateInSeconds: number,
    dividerHTML: node,
};

NewsProvider.defaultProps = {
    className: 'newsoverview__news',
    queryurl: 'https://raw.githubusercontent.com/NilsKaden/api-mock/master/db.json',
    refreshRateInSeconds: 60,
    dividerHTML: null,
    dividerPosition: 1,
};
