/*Name: Aashrawat Shrestha
Email: ashrestha73@myseneca.ca
Student ID: 179413232
DATE: march29
Citation: I borrowed this tvShow.h code from my friend Enjal Bk from section NRA. 
*/
#ifndef SENECA_TVSHOW_H
#define SENECA_TVSHOW_H


#include <string>
#include <vector>
#include <list>
#include "mediaItem.h"

namespace seneca
{
    class TvShow : public MediaItem
    {
    public:
        struct TvEpisode
        {
            const TvShow* m_show{};
            unsigned short m_numberOverall{};
            unsigned short m_season{};
            unsigned short m_numberInSeason{};
            std::string m_airDate{};
            unsigned int m_length{};
            std::string m_title{};
            std::string m_summary{};
        };

    private:
        std::string m_id{};
        std::vector<TvEpisode> m_episodes{};

        TvShow(const std::string& id, const std::string& title, unsigned short year, const std::string& summary);

    public:
        void display(std::ostream& out = std::cout) const override;
        static TvShow* createItem(const std::string& strShow);

        template<typename Collection_t>
        static void addEpisode(Collection_t& col, const std::string& strEpisode)
        {
            if (strEpisode.empty() || strEpisode[0] == '#')
                throw "Not a valid episode.";

            std::string record = strEpisode;
            std::string tokens[8];
            size_t start = 0;

            for (int i = 0; i < 7; ++i)
            {
                size_t next = record.find(',', start);
                if (next == std::string::npos)
                    throw "Not a valid episode.";
                tokens[i] = record.substr(start, next - start);
                MediaItem::trim(tokens[i]);
                start = next + 1;
            }

            tokens[7] = record.substr(start);
            MediaItem::trim(tokens[7]);

            TvEpisode ep{};
            ep.m_numberOverall = static_cast<unsigned short>(std::stoi(tokens[1]));
            ep.m_season = tokens[2].empty() ? 1 : static_cast<unsigned short>(std::stoi(tokens[2]));
            ep.m_numberInSeason = static_cast<unsigned short>(std::stoi(tokens[3]));
            ep.m_airDate = tokens[4];
            size_t p1 = tokens[5].find(':');
            size_t p2 = tokens[5].find(':', p1 + 1);

            unsigned int hours = std::stoul(tokens[5].substr(0, p1));
            unsigned int minutes = std::stoul(tokens[5].substr(p1 + 1, p2 - p1 - 1));
            unsigned int seconds = std::stoul(tokens[5].substr(p2 + 1));

            ep.m_length = hours * 3600 + minutes * 60 + seconds;
            ep.m_title = tokens[6];
            ep.m_summary = tokens[7];

            for (size_t i = 0; i < col.size(); ++i)
            {
                TvShow* show = dynamic_cast<TvShow*>(col[i]);
                if (show && show->m_id == tokens[0])
                {
                    ep.m_show = show;
                    show->m_episodes.push_back(ep);
                    return;
                }
            }

            throw std::string("Invalid show ID [") + tokens[0] + "].";
        }

        double getEpisodeAverageLength() const;
        std::list<std::string> getLongEpisodes() const;
    };
}

#endif